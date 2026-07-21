// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { CURATED_CONTENT_REVISION, CURATED_CONTENT_REVISION_KEY, migrateCuratedContentRevision } from './contentMigration';

describe('curated content revision migration', () => {
  beforeEach(() => localStorage.clear());

  it('runs once and leaves unrelated revision progress untouched', () => {
    localStorage.setItem('quiz-arcade:revision:v1', JSON.stringify({ version: 1, reviewedPages: { guide: '2026-01-01' } }));
    localStorage.setItem('quiz-arcade:attempts:v2', JSON.stringify([
      { version: 2, id: 'old', datasetId: 'builtin-az900-paper-3', answers: [] },
      { version: 2, id: 'keep', datasetId: 'community-paper', answers: [] }
    ]));

    expect(migrateCuratedContentRevision()).toBe(true);
    expect(localStorage.getItem(CURATED_CONTENT_REVISION_KEY)).toBe(CURATED_CONTENT_REVISION);
    expect(JSON.parse(localStorage.getItem('quiz-arcade:attempts:v2') ?? '[]').map((attempt: { id: string }) => attempt.id)).toEqual(['keep']);
    expect(localStorage.getItem('quiz-arcade:revision:v1')).toContain('reviewedPages');
    expect(migrateCuratedContentRevision()).toBe(false);
  });
});
