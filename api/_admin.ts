import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminPassword, sendJson } from './_http.js';

export function requireAdmin(request: VercelRequest, response: VercelResponse): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    sendJson(response, 500, { error: 'ADMIN_PASSWORD is not configured.' });
    return false;
  }

  if (getAdminPassword(request) !== adminPassword) {
    sendJson(response, 401, { error: 'Admin password is required.' });
    return false;
  }

  return true;
}
