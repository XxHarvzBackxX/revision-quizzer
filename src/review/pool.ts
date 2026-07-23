import type { PublicDataset, QuizItem } from '../../shared/quiz';
import type { ReviewRecord, ReviewSession } from './types';

export type ReviewPoolItem = {
  record: ReviewRecord;
  dataset: PublicDataset;
  item: QuizItem;
};

export function buildReviewPool(records: ReviewRecord[], datasets: PublicDataset[]): ReviewPoolItem[] {
  const byId = new Map(datasets.map((dataset) => [dataset.id, dataset]));
  return records.flatMap((record) => {
    const dataset = byId.get(record.datasetId);
    if (!dataset) return [];
    if (record.contentRevision && dataset.contentRevision && record.contentRevision !== dataset.contentRevision) return [];
    const byStableId = dataset.items.find((candidate) => candidate.id === record.questionId);
    const item = byStableId?.prompt.slice(0, 240) === record.prompt
      ? byStableId
      : dataset.items[record.questionIndex]?.prompt.slice(0, 240) === record.prompt ? dataset.items[record.questionIndex] : undefined;
    return item ? [{ record, dataset, item }] : [];
  });
}

export function createReviewDataset(session: ReviewSession, pool: ReviewPoolItem[]): PublicDataset {
  const byKey = new Map(pool.map((entry) => [entry.record.key, entry]));
  const selected = session.questionKeys.flatMap((key) => byKey.get(key) ?? []);
  return {
    id: session.id,
    slug: session.id,
    title: 'Mistake Review',
    description: 'A focused review of questions that are due for another attempt.',
    kind: 'quiz',
    curated: false,
    shuffleQuestions: false,
    durationMinutes: Math.max(10, selected.length * 2),
    readinessTarget: 80,
    items: selected.map(({ record, item }) => ({
      ...item,
      sourceDatasetId: record.datasetId,
      sourceDatasetSlug: record.datasetSlug,
      sourceQuestionId: record.questionId,
      sourceExamCode: record.examCode
    })),
    itemCount: selected.length,
    createdAt: session.createdAt,
    status: 'approved'
  };
}
