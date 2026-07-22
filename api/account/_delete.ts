import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteAccount } from '../_account.js';
import { clearAuthCookies, requireProtectedRequest, requireUser, verifyFreshIdToken } from '../_auth.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'DELETE') {
    sendMethodNotAllowed(response, ['DELETE']);
    return;
  }
  if (!await requireProtectedRequest(request, response)) return;
  const user = await requireUser(request, response);
  if (!user) return;
  try {
    if (!await verifyFreshIdToken(request, user.uid)) {
      sendJson(response, 401, { error: 'Sign in again immediately before deleting your account.', code: 'recent_auth_required' });
      return;
    }
    const body = await readJsonBody(request);
    const approvedContent = isRecord(body) && body.approvedContent === 'delete' ? 'delete' : 'anonymize';
    await deleteAccount(user.uid, approvedContent);
    clearAuthCookies(response);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    sendServerError(response, error);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
