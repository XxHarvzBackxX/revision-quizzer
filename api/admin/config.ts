import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AdminConfig } from '../../shared/quiz.js';
import { requireAdmin } from '../_admin.js';
import { getDatabase } from '../_firebase.js';
import { readJsonBody, sendJson } from '../_http.js';

const CONFIG_COLLECTION = 'config';
const CONFIG_DOC = 'app';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireAdmin(request, response)) {
    return;
  }

  try {
    if (request.method === 'GET') {
      const config = await getConfig();
      sendJson(response, 200, { config });
      return;
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request);
      const moderationEnabled = typeof body === 'object' && body !== null && 'moderationEnabled' in body
        ? Boolean(body.moderationEnabled)
        : false;
      const config = { moderationEnabled };
      await getDatabase().collection(CONFIG_COLLECTION).doc(CONFIG_DOC).set(config, { merge: true });
      sendJson(response, 200, { config });
      return;
    }

    response.setHeader('Allow', 'GET, PUT');
    sendJson(response, 405, { error: 'Method not allowed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(response, 500, { error: message });
  }
}

async function getConfig(): Promise<AdminConfig> {
  const doc = await getDatabase().collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
  return { moderationEnabled: Boolean(doc.data()?.moderationEnabled) };
}
