import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    sendMethodNotAllowed(response, ['POST']);
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    sendJson(response, 500, { error: 'ADMIN_PASSWORD is not configured.' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const password = typeof body === 'object' && body !== null && 'password' in body
      ? String(body.password)
      : '';

    if (password !== adminPassword) {
      sendJson(response, 401, { error: 'Incorrect admin password.' });
      return;
    }

    sendJson(response, 200, { ok: true });
  } catch (error) {
    sendServerError(response, error);
  }
}
