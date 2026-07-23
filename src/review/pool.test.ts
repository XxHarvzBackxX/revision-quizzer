import { describe, expect, it } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import type { ReviewRecord } from './types';
import { buildReviewPool, createReviewDataset } from './pool';

const dataset: PublicDataset = {
  id: 'source', slug: 'source', title: 'Source', kind: 'quiz', curated: true, examCode: 'AI-901',
  contentRevision: 'one', itemCount: 1, createdAt: '2026-07-01',
  items: [{ id: 'q1', type: 'multiple-choice', prompt: 'Stable prompt', answer: 'A', options: ['A', 'B'], objectiveId: 'responsible-ai' }]
};
const record: ReviewRecord = {
  key: 'source/q1', datasetId: 'source', datasetSlug: 'source', datasetTitle: 'Source', questionId: 'q1', questionIndex: 0,
  prompt: 'Stable prompt', examCode: 'AI-901', objectiveId: 'responsible-ai', contentRevision: 'one', firstWrongAt: '2026-07-01',
  lastWrongAt: '2026-07-01', wrongCount: 1, correctStreak: 0, dueOn: '2026-07-02', available: true
};

describe('mistake review question pool', () => {
  it('preserves source provenance in a mixed review dataset', () => {
    const pool = buildReviewPool([record], [dataset]);
    const review = createReviewDataset({ id: 'review-1', questionKeys: [record.key], createdAt: '2026-07-02' }, pool);
    expect(review.items[0]).toMatchObject({ sourceDatasetId: 'source', sourceQuestionId: 'q1', sourceExamCode: 'AI-901' });
  });

  it('excludes questions whose source content materially changed', () => {
    expect(buildReviewPool([record], [{ ...dataset, contentRevision: 'two' }])).toEqual([]);
    expect(buildReviewPool([record], [{ ...dataset, items: [{ ...dataset.items[0], prompt: 'Changed prompt' }] }])).toEqual([]);
  });
});
