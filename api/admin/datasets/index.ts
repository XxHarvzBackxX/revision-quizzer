import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PublicDataset } from '../../../shared/quiz.js';
import { requireAdmin } from '../../_admin.js';
import { getDatabase } from '../../_firebase.js';
import { sendJson } from '../../_http.js';

const COLLECTION = 'datasets';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireAdmin(request, response)) {
    return;
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const snapshot = await getDatabase().collection(COLLECTION).orderBy('createdAt', 'desc').limit(100).get();
    const datasets = snapshot.docs.map((doc) => toPublicDataset(doc.id, doc.data()));
    sendJson(response, 200, { datasets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(response, 500, { error: message });
  }
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
    shuffleQuestions: Boolean(data.shuffleQuestions),
    itemCount: data.itemCount ?? data.items?.length ?? 0,
    createdAt,
    status: data.status ?? 'approved',
    items: data.items ?? []
  };
}
