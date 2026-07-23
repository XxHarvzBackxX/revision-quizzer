// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import {
  beginReviewSession,
  getReviewState,
  importReviewHistory,
  isReviewDue,
  localDateKey,
  recordReviewResponse,
  reviewStatus,
  saveReviewNote,
  selectDueReviewRecords
} from './storage';

const dataset: PublicDataset = {
  id: 'community-one',
  slug: 'community-one',
  title: 'Community One',
  kind: 'quiz',
  curated: false,
  shuffleQuestions: false,
  items: [
    { id: 'q1', type: 'multiple-choice', prompt: 'First question?', options: ['A', 'B'], answer: 'A' },
    { id: 'q2', type: 'multiple-choice', prompt: 'Second question?', options: ['A', 'B'], answer: 'B' }
  ],
  itemCount: 2,
  createdAt: '2026-07-01T00:00:00.000Z'
};

describe('mistake review storage', () => {
  beforeEach(() => localStorage.clear());

  it('deduplicates mistakes and recovers after two due correct answers', () => {
    const wrongAt = new Date(2026, 6, 20, 12);
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: false, confidence: 'sure', answeredAt: wrongAt });
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: false, answeredAt: new Date(2026, 6, 20, 14) });
    let record = getReviewState().records['community-one/q1'];
    expect(record).toMatchObject({ wrongCount: 2, correctStreak: 0, dueOn: '2026-07-21', lastConfidence: 'sure' });

    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: true, answeredAt: new Date(2026, 6, 20, 18) });
    expect(getReviewState().records['community-one/q1'].correctStreak).toBe(0);

    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: true, answeredAt: new Date(2026, 6, 21, 10) });
    record = getReviewState().records['community-one/q1'];
    expect(record).toMatchObject({ correctStreak: 1, dueOn: '2026-07-24' });
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: true, answeredAt: new Date(2026, 6, 24, 10) });
    record = getReviewState().records['community-one/q1'];
    expect(record.correctStreak).toBe(2);
    expect(record.recoveredAt).toBeTruthy();
    expect(reviewStatus(record, new Date(2026, 6, 25))).toBe('recovered');
  });

  it('reopens a recovered item after another mistake', () => {
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: false, answeredAt: new Date(2026, 6, 1) });
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: true, answeredAt: new Date(2026, 6, 2) });
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: true, answeredAt: new Date(2026, 6, 5) });
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: false, answeredAt: new Date(2026, 6, 8) });
    expect(getReviewState().records['community-one/q1']).toMatchObject({ correctStreak: 0, wrongCount: 2, dueOn: '2026-07-09' });
  });

  it('prioritizes confident mistakes and persists notes and sessions', () => {
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: false, confidence: 'guess', answeredAt: new Date(2026, 6, 1) });
    recordReviewResponse({ dataset, item: dataset.items[1], questionIndex: 1, correct: false, confidence: 'sure', answeredAt: new Date(2026, 6, 1) });
    const records = Object.values(getReviewState().records);
    expect(selectDueReviewRecords(records, 2, new Date(2026, 6, 3)).map((item) => item.questionId)).toEqual(['q2', 'q1']);
    saveReviewNote('community-one/q2', 'Review why B is correct.');
    beginReviewSession(['community-one/q2']);
    expect(getReviewState().records['community-one/q2'].note).toBe('Review why B is correct.');
    expect(getReviewState().activeSession?.questionKeys).toEqual(['community-one/q2']);
  });

  it('imports retained history once and makes unresolved mistakes due immediately', () => {
    const attempts: AttemptRecord[] = [attempt('a1', '2026-07-01T12:00:00.000Z', false), attempt('a2', '2026-07-02T12:00:00.000Z', true)];
    const imported = importReviewHistory(attempts, [dataset], new Date(2026, 6, 20, 12));
    expect(imported.records['community-one/q1']).toMatchObject({ wrongCount: 1, correctStreak: 1, dueOn: '2026-07-20' });
    expect(isReviewDue(imported.records['community-one/q1'], new Date(2026, 6, 20))).toBe(true);
    expect(importReviewHistory([], [], new Date(2026, 6, 21))).toEqual(imported);
    expect(localDateKey(new Date(2026, 6, 20))).toBe('2026-07-20');
  });
});

function attempt(id: string, completedAt: string, correct: boolean): AttemptRecord {
  return {
    version: 2,
    id,
    datasetId: dataset.id,
    slug: dataset.slug,
    title: dataset.title,
    mode: 'practice',
    score: correct ? 1 : 0,
    total: 1,
    percentage: correct ? 100 : 0,
    readinessTarget: 70,
    startedAt: completedAt,
    completedAt,
    durationSeconds: 60,
    answers: [{ questionIndex: 0, questionId: 'q1', response: [correct ? 'A' : 'B'], correct, flagged: false }],
    domains: []
  };
}
