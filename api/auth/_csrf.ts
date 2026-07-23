import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueCsrfToken } from '../_auth.js';
import { sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET']);
    return;
  }
  try {
    sendJson(response, 200, { csrfToken: issueCsrfToken(response) });
  } catch (error) {
    sendServerError(response, error);
  }
}
