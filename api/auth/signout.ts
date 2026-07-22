import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookies, requireProtectedRequest } from '../_auth.js';
import { sendJson, sendMethodNotAllowed } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    sendMethodNotAllowed(response, ['POST']);
    return;
  }
  if (!await requireProtectedRequest(request, response)) return;
  clearAuthCookies(response);
  sendJson(response, 200, { ok: true });
}
