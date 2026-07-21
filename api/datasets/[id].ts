import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findCuratedDataset } from '../_curated.js';
import { getDatasetsCollection, isPublicDataset, toPublicDataset } from '../_datasets.js';
import { getQueryParam, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET']);
    return;
  }

  try {
    const id = getQueryParam(request, 'id');
    const curated = findCuratedDataset(id);
    if (curated) {
      sendJson(response, 200, { dataset: curated });
      return;
    }
    const datasets = getDatasetsCollection();
    const directDoc = await datasets.doc(id).get();

    if (directDoc.exists) {
      sendPublicDataset(response, toPublicDataset(directDoc.id, directDoc.data() ?? {}));
      return;
    }

    const slugSnapshot = await datasets.where('slug', '==', id).limit(1).get();
    if (slugSnapshot.empty) {
      sendJson(response, 404, { error: 'Dataset not found.' });
      return;
    }

    const slugDoc = slugSnapshot.docs[0];
    sendPublicDataset(response, toPublicDataset(slugDoc.id, slugDoc.data()));
  } catch (error) {
    sendServerError(response, error);
  }
}

function sendPublicDataset(response: VercelResponse, dataset: ReturnType<typeof toPublicDataset>): void {
  if (!isPublicDataset(dataset)) {
    sendJson(response, 404, { error: 'Dataset not found.' });
    return;
  }

  sendJson(response, 200, { dataset });
}
