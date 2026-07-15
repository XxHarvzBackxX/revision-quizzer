import { describe, expect, it } from 'vitest';
import { parseRoute, routeClass } from './routing';

describe('quiz routes', () => {
  it('parses explicit exam, practice, and result routes', () => {
    expect(parseRoute('/quiz/paper/exam')).toMatchObject({ name: 'quiz-exam', slug: 'paper' });
    expect(parseRoute('/quiz/paper/practice')).toMatchObject({ name: 'quiz-practice', slug: 'paper' });
    expect(parseRoute('/quiz/paper/results/attempt-1')).toMatchObject({ name: 'quiz-result', slug: 'paper', attemptId: 'attempt-1' });
  });

  it('keeps legacy play links working as practice mode', () => {
    const route = parseRoute('/quiz/paper/play');
    expect(route.name).toBe('quiz-practice');
    expect(routeClass(route)).toBe('quiz-play practice-mode');
  });
});
