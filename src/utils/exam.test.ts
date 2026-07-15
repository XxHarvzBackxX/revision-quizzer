import { describe, expect, it } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import { buildAttempt, createExamSession, getOrderedQuestions, seededShuffle } from './exam';

const dataset: PublicDataset = {
  id: 'paper-1',
  slug: 'paper-1',
  title: 'Paper one',
  itemCount: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  durationMinutes: 45,
  readinessTarget: 70,
  shuffleQuestions: true,
  items: [
    { id: 'q1', type: 'multiple-choice', prompt: 'First?', answer: 'A', options: ['A', 'B'], domainId: 'concepts' },
    { id: 'q2', type: 'multi-select', prompt: 'Two?', answers: ['C', 'D'], options: ['C', 'D', 'E'], domainId: 'foundry' }
  ]
};

describe('exam sessions', () => {
  it('uses deterministic seeded shuffling', () => {
    expect(seededShuffle([1, 2, 3, 4, 5], 'same')).toEqual(seededShuffle([1, 2, 3, 4, 5], 'same'));
    expect(seededShuffle([1, 2, 3, 4, 5], 'same')).not.toEqual(seededShuffle([1, 2, 3, 4, 5], 'different'));
  });

  it('keeps item and option order stable for a session', () => {
    const session = createExamSession(dataset, new Date('2026-01-01T10:00:00.000Z'));
    expect(session.expiresAt).toBe('2026-01-01T10:45:00.000Z');
    expect(getOrderedQuestions(dataset, session)).toEqual(getOrderedQuestions(dataset, session));
  });

  it('scores attempts and groups domain results', () => {
    const session = createExamSession(dataset, new Date('2026-01-01T10:00:00.000Z'));
    session.itemOrder = [0, 1];
    session.answers = { '0': ['A'], '1': ['C'] };
    session.flags = [1];
    const attempt = buildAttempt({ dataset, mode: 'exam', session, completedAt: new Date('2026-01-01T10:10:00.000Z') });
    expect(attempt.score).toBe(1);
    expect(attempt.total).toBe(2);
    expect(attempt.percentage).toBe(50);
    expect(attempt.durationSeconds).toBe(600);
    expect(attempt.domains).toEqual([
      { domainId: 'concepts', correct: 1, total: 1 },
      { domainId: 'foundry', correct: 0, total: 1 }
    ]);
  });
});
