import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccountInputError, accountRef, createAccount, toAccountProfile, touchAccount, validateOnboarding } from '../_account.js';
import { SESSION_MAX_AGE_MS, isFreshToken, requireProtectedRequest, setSessionCookie } from '../_auth.js';
import { getFirebaseAuth } from '../_firebase.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    sendMethodNotAllowed(response, ['POST']);
    return;
  }
  if (!await requireProtectedRequest(request, response)) return;

  try {
    const body = await readJsonBody(request);
    const idToken = isRecord(body) && typeof body.idToken === 'string' ? body.idToken : '';
    if (!idToken) {
      sendJson(response, 400, { error: 'A Firebase identity token is required.', code: 'missing_token' });
      return;
    }
    const decoded = await getFirebaseAuth().verifyIdToken(idToken, true);
    if (!decoded.email || decoded.email_verified !== true) {
      sendJson(response, 403, { error: 'Verify your email address before signing in.', code: 'email_not_verified' });
      return;
    }
    if (!isFreshToken(decoded)) {
      sendJson(response, 401, { error: 'Please sign in again to continue.', code: 'recent_auth_required' });
      return;
    }

    let account = await accountRef(decoded.uid).get();
    if (!account.exists) {
      const onboarding = validateOnboarding(isRecord(body) ? body.onboarding : null);
      if (!onboarding.ok) {
        sendJson(response, 428, { error: onboarding.error, code: 'onboarding_required' });
        return;
      }
      await createAccount(decoded.uid, decoded.email, onboarding.value);
      account = await accountRef(decoded.uid).get();
    }
    if (account.data()?.status !== 'active') {
      sendJson(response, 403, { error: 'This account is not active.', code: 'account_inactive' });
      return;
    }
    await touchAccount(decoded.uid, account.data() ?? {});

    const cookie = await getFirebaseAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
    setSessionCookie(response, cookie);
    sendJson(response, 200, { account: toAccountProfile(decoded.uid, account.data() ?? {}, decoded.admin === true) });
  } catch (error) {
    if (error instanceof AccountInputError) {
      sendJson(response, 409, { error: error.message, code: error.code });
      return;
    }
    sendServerError(response, error);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
