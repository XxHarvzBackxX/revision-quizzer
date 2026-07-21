import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { getDatasetsCollection, toPublicDataset } from '../../_datasets.js';
import { sendJson, sendMethodNotAllowed, sendServerError } from '../../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireAdmin(request, response)) {
    return;
  }

  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET']);
    return;
  }

  try {
    const snapshot = await getDatasetsCollection().orderBy('createdAt', 'desc').limit(100).get();
    const datasets = snapshot.docs.map((doc) => toPublicDataset(doc.id, doc.data()));
    sendJson(response, 200, { datasets });
  } catch (error) {
    sendServerError(response, error);
  }
}
