import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PublicDataset } from '../../shared/quiz.js';
import { getDatabase } from '../_firebase.js';
import { sendJson } from '../_http.js';

const COLLECTION = 'datasets';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const id = getRouteId(request);
    const database = getDatabase();
    const directDoc = await database.collection(COLLECTION).doc(id).get();

    if (directDoc.exists) {
      sendJson(response, 200, { dataset: toPublicDataset(directDoc.id, directDoc.data() ?? {}) });
      return;
    }

    const slugSnapshot = await database.collection(COLLECTION).where('slug', '==', id).limit(1).get();
    if (slugSnapshot.empty) {
      sendJson(response, 404, { error: 'Dataset not found.' });
      return;
    }

    const slugDoc = slugSnapshot.docs[0];
    sendJson(response, 200, { dataset: toPublicDataset(slugDoc.id, slugDoc.data()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(response, 500, { error: message });
  }
}

function getRouteId(request: VercelRequest): string {
  const value = request.query.id;
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function toPublicDataset(id: string, data: FirebaseFirestore.DocumentData): PublicDataset {
  const createdAt = typeof data.createdAt?.toDate === 'function'
    ? data.createdAt.toDate().toISOString()
    : new Date().toISOString();

  return {
    id,
    slug: data.slug,
    title: data.title,
    description: data.description ?? '',
    tags: data.tags ?? [],
    itemCount: data.itemCount ?? data.items?.length ?? 0,
    createdAt,
    items: data.items ?? []
  };
}
