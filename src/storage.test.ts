import { beforeEach, describe, expect, it } from 'vitest';
import { clearActiveExamSession, getActiveExamSession, getAttempts, saveActiveExamSession } from './storage';

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
});
