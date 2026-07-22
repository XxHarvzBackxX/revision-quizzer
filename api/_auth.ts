import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SESSION_DURATION_DAYS } from '../shared/account.js';
import { getFirebaseAppCheck, getFirebaseAuth } from './_firebase.js';
import { getHeader, sendJson } from './_http.js';

const PRODUCTION_SESSION_COOKIE = '__Host-quiz_arcade_session';
const DEVELOPMENT_SESSION_COOKIE = 'quiz_arcade_session';
const PRODUCTION_CSRF_COOKIE = '__Host-quiz_arcade_csrf';
const DEVELOPMENT_CSRF_COOKIE = 'quiz_arcade_csrf';
export const SESSION_MAX_AGE_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
const FRESH_AUTH_SECONDS = 5 * 60;

export type AuthenticatedUser = {
  token: DecodedIdToken;
  uid: string;
  admin: boolean;
};

export function issueCsrfToken(response: VercelResponse): string {
  const token = randomBytes(32).toString('base64url');
  response.setHeader('Set-Cookie', serializeCookie(csrfCookieName(), signCsrf(token), {
    httpOnly: true,
    maxAgeSeconds: 60 * 60,
    sameSite: 'Strict'
  }));
  return token;
}

export function setSessionCookie(response: VercelResponse, cookie: string): void {
  response.setHeader('Set-Cookie', serializeCookie(sessionCookieName(), cookie, {
    httpOnly: true,
    maxAgeSeconds: Math.floor(SESSION_MAX_AGE_MS / 1000),
    sameSite: 'Lax'
  }));
}

export function clearAuthCookies(response: VercelResponse): void {
  response.setHeader('Set-Cookie', [
    serializeCookie(sessionCookieName(), '', { httpOnly: true, maxAgeSeconds: 0, sameSite: 'Lax' }),
    serializeCookie(csrfCookieName(), '', { httpOnly: true, maxAgeSeconds: 0, sameSite: 'Strict' })
  ]);
}

export async function requireUser(request: VercelRequest, response: VercelResponse): Promise<AuthenticatedUser | null> {
  const cookie = parseCookies(request)[sessionCookieName()];
  if (!cookie) {
    sendJson(response, 401, { error: 'Sign in is required.', code: 'auth_required' });
    return null;
  }

  try {
    const token = await getFirebaseAuth().verifySessionCookie(cookie, true);
    return { token, uid: token.uid, admin: token.admin === true };
  } catch {
    clearAuthCookies(response);
    sendJson(response, 401, { error: 'Your session has expired. Please sign in again.', code: 'session_expired' });
    return null;
  }
}

export async function requireAdmin(request: VercelRequest, response: VercelResponse): Promise<AuthenticatedUser | null> {
  const user = await requireUser(request, response);
  if (!user) return null;
  if (!user.admin) {
    sendJson(response, 403, { error: 'Administrator access is required.', code: 'admin_required' });
    return null;
  }
  return user;
}

export async function requireProtectedRequest(request: VercelRequest, response: VercelResponse): Promise<boolean> {
  if (!verifyOrigin(request)) {
    sendJson(response, 403, { error: 'The request origin could not be verified.', code: 'invalid_origin' });
    return false;
  }
  if (!verifyCsrf(request)) {
    sendJson(response, 403, { error: 'The security token is invalid. Refresh and try again.', code: 'invalid_csrf' });
    return false;
  }
  return verifyAppCheck(request, response);
}

export async function verifyAppCheck(request: VercelRequest, response: VercelResponse): Promise<boolean> {
  const token = getHeader(request, 'x-firebase-appcheck');
  const enforced = process.env.FIREBASE_APP_CHECK_ENFORCED === 'true';
  if (!token) {
    if (enforced) sendJson(response, 401, { error: 'App verification is required.', code: 'app_check_required' });
    return !enforced;
  }
  try {
    await getFirebaseAppCheck().verifyToken(token);
    return true;
  } catch {
    sendJson(response, 401, { error: 'App verification failed.', code: 'invalid_app_check' });
    return false;
  }
}

export async function verifyFreshIdToken(request: VercelRequest, expectedUid?: string): Promise<DecodedIdToken | null> {
  const idToken = getHeader(request, 'x-firebase-id-token');
  if (!idToken) return null;
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken, true);
    const age = Math.floor(Date.now() / 1000) - decoded.auth_time;
    if (age > FRESH_AUTH_SECONDS || (expectedUid && decoded.uid !== expectedUid)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function isFreshToken(token: DecodedIdToken): boolean {
  return Math.floor(Date.now() / 1000) - token.auth_time <= FRESH_AUTH_SECONDS;
}

function verifyOrigin(request: VercelRequest): boolean {
  const origin = getHeader(request, 'origin');
  if (!origin) return process.env.NODE_ENV !== 'production';
  const configured = process.env.APP_ORIGIN?.replace(/\/$/, '');
  if (configured) return origin === configured;
  const host = getHeader(request, 'x-forwarded-host') || getHeader(request, 'host');
  const protocol = getHeader(request, 'x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return origin === `${protocol}://${host}`;
}

function verifyCsrf(request: VercelRequest): boolean {
  const supplied = getHeader(request, 'x-csrf-token');
  const signed = parseCookies(request)[csrfCookieName()];
  if (!supplied || !signed) return false;
  const expected = signCsrf(supplied);
  const left = Buffer.from(signed);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signCsrf(token: string): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret || secret.length < 32) throw new Error('CSRF_SECRET must contain at least 32 characters.');
  return `${token}.${createHmac('sha256', secret).update(token).digest('base64url')}`;
}

function parseCookies(request: VercelRequest): Record<string, string> {
  const raw = getHeader(request, 'cookie');
  return Object.fromEntries(raw.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [];
    return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]];
  }));
}

function serializeCookie(name: string, value: string, options: { httpOnly: boolean; maxAgeSeconds: number; sameSite: 'Lax' | 'Strict' }): string {
  const secure = process.env.NODE_ENV === 'production';
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${options.maxAgeSeconds}`,
    options.httpOnly ? 'HttpOnly' : '',
    secure ? 'Secure' : '',
    `SameSite=${options.sameSite}`
  ].filter(Boolean).join('; ');
}

function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_SESSION_COOKIE : DEVELOPMENT_SESSION_COOKIE;
}

function csrfCookieName(): string {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_CSRF_COOKIE : DEVELOPMENT_CSRF_COOKIE;
}
