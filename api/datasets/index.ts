import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Timestamp } from 'firebase-admin/firestore';
import { createSlug, type DatasetSummary, type PublicDataset, validateDataset } from '../../shared/quiz.js';
import { getDatabase } from '../_firebase.js';
import { getAdminPassword, getUploadKey, readJsonBody, sendJson } from '../_http.js';

const COLLECTION = 'datasets';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    if (request.method === 'GET') {
      await listDatasets(response);
      return;
    }

    if (request.method === 'POST') {
      await createDataset(request, response);
      return;
    }

    response.setHeader('Allow', 'GET, POST');
    sendJson(response, 405, { error: 'Method not allowed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(response, 500, { error: message });
  }
}

async function listDatasets(response: VercelResponse) {
  const snapshot = await getDatabase()
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const datasets: DatasetSummary[] = snapshot.docs
    .map((doc) => toPublicDataset(doc.id, doc.data(), false))
    .filter((dataset) => dataset.status !== 'pending')
    .slice(0, 50);
  sendJson(response, 200, { datasets });
}

async function createDataset(request: VercelRequest, response: VercelResponse) {
  const database = getDatabase();
  const configDoc = await database.collection('config').doc('app').get();
  const config = configDoc.data() ?? {};
  const expectedKey = String(config.uploadKey ?? process.env.UPLOAD_KEY ?? '').trim();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const hasUploadKey = expectedKey.length === 0 || getUploadKey(request) === expectedKey;
  const hasAdminPassword = Boolean(adminPassword && getAdminPassword(request) === adminPassword);

  if (!hasUploadKey && !hasAdminPassword) {
    sendJson(response, 401, { error: 'Invalid upload key.' });
    return;
  }

  const body = await readJsonBody(request);
  const result = validateDataset(body);

  if (!result.ok) {
    sendJson(response, 400, { errors: result.errors });
    return;
  }

  const document = database.collection(COLLECTION).doc();
  const slug = createSlug(result.value.title, document.id);
  const moderationEnabled = Boolean(config.moderationEnabled);
  const status = hasAdminPassword || !moderationEnabled ? 'approved' : 'pending';

  const dataset = {
    ...result.value,
    slug,
    status,
    itemCount: result.value.items.length,
    createdAt: Timestamp.now()
  };

  await document.set(dataset);

  sendJson(response, 201, {
    dataset: toPublicDataset(document.id, dataset, true)
  });
}

function toPublicDataset(id: string, data: FirebaseFirestore.DocumentData, includeItems: true): PublicDataset;
function toPublicDataset(id: string, data: FirebaseFirestore.DocumentData, includeItems: false): DatasetSummary;
function toPublicDataset(id: string, data: FirebaseFirestore.DocumentData, includeItems: boolean): PublicDataset | DatasetSummary {
  const createdAt = typeof data.createdAt?.toDate === 'function'
    ? data.createdAt.toDate().toISOString()
    : new Date().toISOString();

  const base = {
    id,
    slug: data.slug,
    title: data.title,
    description: data.description ?? '',
    tags: data.tags ?? [],
    shuffleQuestions: Boolean(data.shuffleQuestions),
    itemCount: data.itemCount ?? data.items?.length ?? 0,
    createdAt,
    status: data.status ?? 'approved'
  };

  return includeItems ? { ...base, items: data.items ?? [] } : base;
}
