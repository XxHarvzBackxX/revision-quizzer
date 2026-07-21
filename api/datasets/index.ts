import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Timestamp } from 'firebase-admin/firestore';
import { createSlug, type DatasetSummary, validateDataset } from '../../shared/quiz.js';
import { getAppConfig } from '../_config.js';
import { getCuratedSummaries, isSupersededCuratedDataset } from '../_curated.js';
import {
  getDatasetsCollection,
  isPublicDataset,
  toDatasetSummary,
  toPublicDataset
} from '../_datasets.js';
import {
  getAdminPassword,
  getUploadKey,
  readJsonBody,
  sendJson,
  sendMethodNotAllowed,
  sendServerError
} from '../_http.js';

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

    sendMethodNotAllowed(response, ['GET', 'POST']);
  } catch (error) {
    sendServerError(response, error);
  }
}

async function listDatasets(response: VercelResponse) {
  let community: DatasetSummary[] = [];
  try {
    const snapshot = await getDatasetsCollection().orderBy('createdAt', 'desc').limit(100).get();
    community = snapshot.docs
      .map((doc) => toDatasetSummary(doc.id, doc.data()))
      .filter((dataset) => isPublicDataset(dataset) && !isSupersededCuratedDataset(dataset))
      .slice(0, 47);
  } catch (error) {
    console.warn('Community datasets unavailable; serving the built-in curated library.', error);
  }
  sendJson(response, 200, { datasets: [...getCuratedSummaries(), ...community] });
}

async function createDataset(request: VercelRequest, response: VercelResponse) {
  const config = await getAppConfig();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const hasUploadKey = config.uploadKey.length === 0 || getUploadKey(request) === config.uploadKey;
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

  const document = getDatasetsCollection().doc();
  const slug = createSlug(result.value.title, document.id);
  const status = hasAdminPassword || !config.moderationEnabled ? 'approved' : 'pending';

  const dataset = {
    ...result.value,
    slug,
    status,
    itemCount: result.value.items.length,
    createdAt: Timestamp.now()
  };

  await document.set(dataset);

  sendJson(response, 201, {
    dataset: toPublicDataset(document.id, dataset)
  });
}
