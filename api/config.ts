import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PublicConfig } from '../shared/quiz.js';
import { getDatabase } from './_firebase.js';
import { sendJson } from './_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const doc = await getDatabase().collection('config').doc('app').get();
    const uploadKey = String(doc.data()?.uploadKey ?? process.env.UPLOAD_KEY ?? '').trim();
    const config: PublicConfig = { uploadKeyRequired: uploadKey.length > 0 };
    sendJson(response, 200, { config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(response, 500, { error: message });
  }
}
