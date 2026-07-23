import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Timestamp } from 'firebase-admin/firestore';
import { createSlug, type DatasetSummary, validateDataset } from '../../shared/quiz.js';
import { accountRef } from '../_account.js';
import { requireProtectedRequest, requireUser } from '../_auth.js';
import { getAppConfig } from '../_config.js';
import { getCuratedSummaries, isSupersededCuratedDataset } from '../_curated.js';
import {
  getDatasetsCollection,
  isPublicDataset,
  toDatasetSummary,
  toPublicDataset
} from '../_datasets.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

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
  if (!await requireProtectedRequest(request, response)) return;
  const user = await requireUser(request, response);
  if (!user) return;
  const config = await getAppConfig();

  const body = await readJsonBody(request);
  const result = validateDataset(body);

  if (!result.ok) {
    sendJson(response, 400, { errors: result.errors });
    return;
  }

  const document = getDatasetsCollection().doc();
  const slug = createSlug(result.value.title, document.id);
  const status = user.admin || !config.moderationEnabled ? 'approved' : 'pending';
  const account = await accountRef(user.uid).get();
  const accountData = account.data() ?? {};
  const creator = accountData.attributionEnabled === true && typeof accountData.handle === 'string' && typeof accountData.avatar === 'string'
    ? { handle: accountData.handle, avatar: accountData.avatar }
    : undefined;

  const dataset = {
    ...result.value,
    slug,
    status,
    itemCount: result.value.items.length,
    createdAt: Timestamp.now(),
    creatorUid: user.uid,
    attributionEnabled: Boolean(creator),
    ...(creator ? { creator } : {})
  };

  await document.set(dataset);

  sendJson(response, 201, {
    dataset: toPublicDataset(document.id, dataset)
  });
}
