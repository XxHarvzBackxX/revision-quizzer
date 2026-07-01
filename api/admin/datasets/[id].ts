import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSlug, validateDataset } from '../../../shared/quiz.js';
import { requireAdmin } from '../../_admin.js';
import { getDatabase } from '../../_firebase.js';
import { readJsonBody, sendJson } from '../../_http.js';

const COLLECTION = 'datasets';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireAdmin(request, response)) {
    return;
  }

  const id = getRouteId(request);
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
      await getDatabase().collection(COLLECTION).doc(id).delete();
      sendJson(response, 200, { ok: true });
      return;
    }

    response.setHeader('Allow', 'PUT, DELETE');
    sendJson(response, 405, { error: 'Method not allowed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(response, 500, { error: message });
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

  const document = getDatabase().collection(COLLECTION).doc(id);
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

function getRouteId(request: VercelRequest): string {
  const value = request.query.id;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function getStatus(body: unknown): 'approved' | 'pending' {
  if (typeof body === 'object' && body !== null && 'status' in body && body.status === 'pending') {
    return 'pending';
  }

  return 'approved';
}
