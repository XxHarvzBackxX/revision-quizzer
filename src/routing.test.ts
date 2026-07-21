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

  it('parses RevisionWiki index, course, and article routes', () => {
    expect(parseRoute('/wiki')).toEqual({ name: 'wiki', path: '/wiki' });
    expect(parseRoute('/wiki/ai-901')).toMatchObject({ name: 'wiki-course', examCode: 'ai-901' });
    expect(parseRoute('/wiki/az-900/cloud-computing')).toMatchObject({ name: 'wiki-page', examCode: 'az-900', pageSlug: 'cloud-computing' });
    expect(routeClass(parseRoute('/wiki/ai-901/responsible-ai'))).toBe('wiki-page');
  });

  it('parses certification study and drill routes', () => {
    expect(parseRoute('/study')).toEqual({ name: 'study-index', path: '/study' });
    expect(routeClass(parseRoute('/study'))).toBe('study-index');
    expect(parseRoute('/study/profile')).toEqual({ name: 'study-profile', path: '/study/profile' });
    expect(parseRoute('/study/ai-901/academy')).toMatchObject({ name: 'study-academy', examCode: 'ai-901' });
    expect(parseRoute('/study/ai-901')).toMatchObject({ name: 'study-hub', examCode: 'ai-901' });
    expect(parseRoute('/study/ai-901/drill')).toMatchObject({ name: 'study-drill-setup', examCode: 'ai-901' });
    expect(parseRoute('/study/ai-901/drill/play')).toMatchObject({ name: 'study-drill-play', examCode: 'ai-901' });
    expect(parseRoute('/study/ai-901/drill/results/run-1')).toMatchObject({ name: 'study-drill-result', attemptId: 'run-1' });
  });
});
