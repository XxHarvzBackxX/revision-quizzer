import { describe, expect, it } from 'vitest';
import { curatedDatasets } from '../../api/_curated';
import type { PublicDataset } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import { buildCertificationPool, createStudyDataset, filterStudyPool, selectDrillQuestionKeys } from './pool';
import type { ObjectiveMastery, StudyDrillConfig } from './types';

function paper(id: string, curated = true): PublicDataset {
  return {
    id, slug: id, title: id, description: '', kind: 'exam', curated, examCode: 'AI-901', blueprintVersion: '2026', durationMinutes: 45,
    readinessTarget: 70, domains: [{ id: 'domain', title: 'Domain', weight: 100 }], shuffleQuestions: false, itemCount: 1, createdAt: '2026-01-01T00:00:00.000Z',
    items: [{ id: 'q1', type: 'multiple-choice', prompt: `Question ${id}`, answer: 'A', options: ['A', 'B'], domainId: 'domain', objectiveId: 'objective', difficulty: 'medium' }]
  };
}

const mastery: ObjectiveMastery[] = [{ objectiveId: 'objective', title: 'Objective', domainId: 'domain', domainTitle: 'Domain', blueprintWeight: 100, score: 25, evidence: 5, confidentWrong: 0, status: 'needs-work' }];

describe('certification question pools', () => {
  it('registers trusted official content before the curated mock papers', () => {
    expect(curatedDatasets[0]).toMatchObject({
      id: 'builtin-ai901-official-practice-assessment',
      official: true
    });
    expect(curatedDatasets.slice(1).every((dataset) => !dataset.official)).toBe(true);
  });

  it('includes the observed Microsoft Learn assessment in the AI-901 study pool', () => {
    const pool = buildCertificationPool('AI-901', curatedDatasets);

    expect(pool).toHaveLength(200);
    expect(new Set(pool.map((item) => item.datasetId))).toContain('builtin-ai901-official-practice-assessment');
  });

  it('combines curated papers, excludes community content, and preserves source identity', () => {
    const pool = buildCertificationPool('AI-901', [paper('builtin-paper-1'), paper('builtin-paper-2'), paper('community', false)]);
    expect(pool.map((item) => item.key)).toEqual(['builtin-paper-1/q1', 'builtin-paper-2/q1']);
    expect(pool.every((item) => item.domainTitle === 'Domain')).toBe(true);
  });

  it('builds missed and weakest pools', () => {
    const pool = buildCertificationPool('AI-901', [paper('builtin-paper-1'), paper('builtin-paper-2')]);
    const attempts = [{ datasetId: 'builtin-paper-2', answers: [{ correct: false, questionId: 'q1' }] }] as unknown as AttemptRecord[];
    expect(filterStudyPool({ pool, filter: 'missed', mastery, attempts, bookmarks: {} }).map((item) => item.key)).toEqual(['builtin-paper-2/q1']);
    expect(filterStudyPool({ pool, filter: 'weakest', mastery, attempts: [], bookmarks: {} })).toHaveLength(2);
  });

  it('selects a bounded deterministic set and creates a provenance-aware runtime dataset', () => {
    const pool = buildCertificationPool('AI-901', [paper('builtin-paper-1'), paper('builtin-paper-2')]);
    const keys = selectDrillQuestionKeys(pool, 1, 'seed');
    expect(selectDrillQuestionKeys(pool, 1, 'seed')).toEqual(keys);
    const config: StudyDrillConfig = { examCode: 'AI-901', filter: 'all', count: 1, questionKeys: keys, seed: 'seed', createdAt: '2026-07-15T00:00:00.000Z' };
    const dataset = createStudyDataset('AI-901', pool, config);
    expect(dataset.items).toHaveLength(1);
    expect(dataset.items[0]).toMatchObject({ sourceQuestionId: 'q1' });
  });
});
