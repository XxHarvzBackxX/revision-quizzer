import type { DocumentData } from 'firebase-admin/firestore';
import type { DatasetSummary, PublicDataset } from '../shared/quiz.js';
import { getDatabase } from './_firebase.js';

const DATASETS_COLLECTION = 'datasets';

export function getDatasetsCollection() {
  return getDatabase().collection(DATASETS_COLLECTION);
}

export function toDatasetSummary(id: string, data: DocumentData): DatasetSummary {
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
    kind: data.kind ?? 'quiz',
    curated: Boolean(data.curated),
    examCode: data.examCode,
    blueprintVersion: data.blueprintVersion,
    durationMinutes: data.durationMinutes,
    readinessTarget: data.readinessTarget,
    domains: data.domains,
    itemCount: data.itemCount ?? data.items?.length ?? 0,
    createdAt,
    status: data.status ?? 'approved'
  };
}

export function toPublicDataset(id: string, data: DocumentData): PublicDataset {
  return {
    ...toDatasetSummary(id, data),
    items: data.items ?? []
  };
}

export function isPublicDataset(dataset: Pick<PublicDataset, 'status'>): boolean {
  return dataset.status !== 'pending';
}
