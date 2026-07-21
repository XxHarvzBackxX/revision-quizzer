import { beforeEach, describe, expect, it } from 'vitest';
import { clearActiveExamSession, getActiveExamSession, getAttempts, resetStoredQuizProgress, saveActiveExamSession } from './storage';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear()
  },
  configurable: true
});

describe('local progress storage', () => {
  beforeEach(() => values.clear());

  it('migrates legacy scores without deleting them', () => {
    localStorage.setItem('quiz-arcade:scores', JSON.stringify([{ datasetId: 'old', title: 'Old quiz', score: 8, total: 10, completedAt: '2025-01-01T00:00:00.000Z' }]));
    const attempts = getAttempts();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ datasetId: 'old', percentage: 80, mode: 'practice' });
    expect(localStorage.getItem('quiz-arcade:scores')).not.toBeNull();
  });

  it('saves and clears resumable exam sessions', () => {
    const session = {
      version: 1 as const,
      datasetId: 'paper', slug: 'paper', title: 'Paper', itemOrder: [0], optionOrders: {}, answers: {}, flags: [], currentIndex: 0,
      startedAt: '2026-01-01T10:00:00.000Z', expiresAt: '2026-01-01T10:45:00.000Z'
    };
    saveActiveExamSession(session);
    expect(getActiveExamSession('paper')).toEqual(session);
    clearActiveExamSession('paper');
    expect(getActiveExamSession('paper')).toBeUndefined();
  });

  it('resets rewritten curated and study-drill progress while preserving unrelated records', () => {
    const attempt = (id: string, datasetId: string, sourceDatasetId?: string) => ({
      version: 2, id, datasetId, slug: datasetId, title: datasetId, mode: 'practice', score: 0, total: 1, percentage: 0, readinessTarget: 70,
      startedAt: '2026-01-01T10:00:00.000Z', completedAt: '2026-01-01T10:01:00.000Z', durationSeconds: 60,
      answers: [{ questionIndex: 0, response: [], correct: false, flagged: false, ...(sourceDatasetId ? { sourceDatasetId } : {}) }], domains: []
    });
    localStorage.setItem('quiz-arcade:attempts:v2', JSON.stringify([
      attempt('curated', 'builtin-ai901-paper-1'),
      attempt('drill', 'study-ai901-seed', 'builtin-ai901-paper-2'),
      attempt('keep', 'community-paper')
    ]));
    localStorage.setItem('quiz-arcade:active-exams:v1', JSON.stringify([
      { version: 1, datasetId: 'study-az900-seed', slug: 'study', title: 'Study', itemOrder: [], optionOrders: {}, answers: {}, flags: [], currentIndex: 0, startedAt: '', expiresAt: '' },
      { version: 1, datasetId: 'community-paper', slug: 'keep', title: 'Keep', itemOrder: [], optionOrders: {}, answers: {}, flags: [], currentIndex: 0, startedAt: '', expiresAt: '' }
    ]));

    resetStoredQuizProgress(new Set(['builtin-ai901-paper-1', 'builtin-ai901-paper-2']), ['study-ai901-', 'study-az900-']);

    expect(getAttempts().map(({ id }) => id)).toEqual(['keep']);
    expect(getActiveExamSession('community-paper')).toBeTruthy();
    expect(getActiveExamSession('study-az900-seed')).toBeUndefined();
  });
});
