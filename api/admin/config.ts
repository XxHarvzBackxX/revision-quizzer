import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { getAppConfig, saveAppConfig } from '../_config.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireAdmin(request, response)) {
    return;
  }

  try {
    if (request.method === 'GET') {
      const config = await getAppConfig();
      sendJson(response, 200, { config });
      return;
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request);
      const moderationEnabled = typeof body === 'object' && body !== null && 'moderationEnabled' in body
        ? Boolean(body.moderationEnabled)
        : false;
      const uploadKey = typeof body === 'object' && body !== null && 'uploadKey' in body
        ? String(body.uploadKey).trim()
        : '';
      const config = { moderationEnabled, uploadKey };
      await saveAppConfig(config);
      sendJson(response, 200, { config });
      return;
    }

    sendMethodNotAllowed(response, ['GET', 'PUT']);
  } catch (error) {
    sendServerError(response, error);
  }
}
