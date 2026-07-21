import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSlug, validateDataset } from '../../../shared/quiz.js';
import { requireAdmin } from '../../_admin.js';
import { getDatasetsCollection } from '../../_datasets.js';
import {
  getQueryParam,
  readJsonBody,
  sendJson,
  sendMethodNotAllowed,
  sendServerError
} from '../../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireAdmin(request, response)) {
    return;
  }

  const id = getQueryParam(request, 'id');
  if (!id) {
    sendJson(response, 400, { error: 'Dataset id is required.' });
    return;
  }

  try {
    if (request.method === 'PUT') {
      await updateDataset(id, request, response);
      return;
    }

    if (request.method === 'DELETE') {
      await getDatasetsCollection().doc(id).delete();
      sendJson(response, 200, { ok: true });
      return;
    }

    sendMethodNotAllowed(response, ['PUT', 'DELETE']);
  } catch (error) {
    sendServerError(response, error);
  }
}

async function updateDataset(id: string, request: VercelRequest, response: VercelResponse) {
  const body = await readJsonBody(request);
  const status = getStatus(body);
  const datasetBody = typeof body === 'object' && body !== null && 'dataset' in body ? body.dataset : body;
  const result = validateDataset(datasetBody);

  if (!result.ok) {
    sendJson(response, 400, { errors: result.errors });
    return;
  }

  const document = getDatasetsCollection().doc(id);
  const current = await document.get();
  if (!current.exists) {
    sendJson(response, 404, { error: 'Dataset not found.' });
    return;
  }

  const currentData = current.data() ?? {};
  await document.set({
    ...result.value,
    slug: currentData.slug ?? createSlug(result.value.title, id),
    status,
    itemCount: result.value.items.length,
    createdAt: currentData.createdAt
  }, { merge: true });

  sendJson(response, 200, { ok: true });
}

function getStatus(body: unknown): 'approved' | 'pending' {
  if (typeof body === 'object' && body !== null && 'status' in body && body.status === 'pending') {
    return 'pending';
  }

  return 'approved';
}
