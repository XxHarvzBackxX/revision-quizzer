import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, requireProtectedRequest } from '../_auth.js';
import { getAppConfig, saveAppConfig } from '../_config.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!await requireAdmin(request, response)) return;

  try {
    if (request.method === 'GET') {
      const config = await getAppConfig();
      sendJson(response, 200, { config });
      return;
    }

    if (request.method === 'PUT') {
      if (!await requireProtectedRequest(request, response)) return;
      const body = await readJsonBody(request);
      const moderationEnabled = typeof body === 'object' && body !== null && 'moderationEnabled' in body
        ? Boolean(body.moderationEnabled)
        : false;
      const themesRequireUnlock = typeof body === 'object' && body !== null && 'themesRequireUnlock' in body
        ? Boolean(body.themesRequireUnlock)
        : true;
      const config = { moderationEnabled, themesRequireUnlock };
      await saveAppConfig(config);
      sendJson(response, 200, { config });
      return;
    }

    sendMethodNotAllowed(response, ['GET', 'PUT']);
  } catch (error) {
    sendServerError(response, error);
  }
}
