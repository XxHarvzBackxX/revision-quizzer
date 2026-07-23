import type { DocumentData } from 'firebase-admin/firestore';
import type { DatasetInput, DatasetSummary, PublicDataset, QuizItem } from '../shared/quiz.js';
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
    status: data.status ?? 'approved',
    ...(isSafeCreator(data.creator) ? { creator: data.creator } : {})
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

export function assignStableQuestionIds(dataset: DatasetInput, datasetId: string, existingItems: QuizItem[] = []): DatasetInput {
  const prefix = `community-${datasetId.slice(0, 12)}`;
  return {
    ...dataset,
    items: dataset.items.map((item, index) => ({
      ...item,
      id: item.id ?? existingItems[index]?.id ?? `${prefix}-q${String(index + 1).padStart(3, '0')}`
    }))
  };
}

function isSafeCreator(value: unknown): value is { handle: string; avatar: string } {
  return typeof value === 'object' && value !== null
    && 'handle' in value && typeof value.handle === 'string'
    && 'avatar' in value && typeof value.avatar === 'string';
}
