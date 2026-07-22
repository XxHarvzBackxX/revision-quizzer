import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatasetsCollection, toDatasetSummary } from '../_datasets.js';
import { requireProtectedRequest, requireUser } from '../_auth.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response);
  if (!user) return;
  try {
    if (request.method === 'GET') {
      const datasets = await getDatasetsCollection().where('creatorUid', '==', user.uid).limit(100).get();
      sendJson(response, 200, { datasets: datasets.docs.map((document) => toDatasetSummary(document.id, document.data())) });
      return;
    }
    if (request.method === 'DELETE') {
      if (!await requireProtectedRequest(request, response)) return;
      const body = await readJsonBody(request);
      const id = isRecord(body) && typeof body.id === 'string' ? body.id : '';
      if (!id) {
        sendJson(response, 400, { error: 'A submission identifier is required.' });
        return;
      }
      const document = getDatasetsCollection().doc(id);
      const snapshot = await document.get();
      if (!snapshot.exists) {
        sendJson(response, 404, { error: 'Submission not found.' });
        return;
      }
      if (snapshot.data()?.creatorUid !== user.uid) {
        sendJson(response, 403, { error: 'You do not own that submission.' });
        return;
      }
      await document.delete();
      sendJson(response, 200, { ok: true });
      return;
    }
    sendMethodNotAllowed(response, ['GET', 'DELETE']);
  } catch (error) {
    sendServerError(response, error);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
