import { describe, expect, it } from 'vitest';
import type { DatasetSummary } from '../../shared/quiz';
import { getRevisionCourse } from '../revision/registry';
import type { AttemptRecord } from '../storage';
import { calculateCertificationMastery, certificationReadiness, selectStudyRecommendation } from './mastery';

const dataset = { id: 'paper-1', examCode: 'AI-901' } as DatasetSummary;

function attempt(id: string, correct: boolean, confidence: 'sure' | 'unsure' | 'guess' = 'unsure', completedAt = '2026-07-15T12:00:00.000Z'): AttemptRecord {
  return {
    version: 2, id, datasetId: 'paper-1', slug: 'paper-1', title: 'Paper', mode: 'exam', score: correct ? 1 : 0, total: 1,
    percentage: correct ? 100 : 0, readinessTarget: 70, startedAt: completedAt, completedAt, durationSeconds: 20,
    answers: [{ questionIndex: 0, questionId: `q-${id}`, response: [], correct, flagged: false, domainId: 'ai-workloads-fundamentals', objectiveId: 'responsible-ai', confidence }],
    domains: [], examCode: 'AI-901'
  };
}

describe('certification mastery', () => {
  const course = getRevisionCourse('AI-901')!;

  it('requires five observations before calling an objective ready', () => {
    const building = calculateCertificationMastery({ examCode: 'AI-901', attempts: [attempt('1', true, 'sure')], datasets: [dataset], course, now: new Date('2026-07-15T12:00:00.000Z') });
    expect(building.find((item) => item.objectiveId === 'responsible-ai')).toMatchObject({ score: 100, evidence: 1, status: 'building' });

    const ready = calculateCertificationMastery({ examCode: 'AI-901', attempts: [1, 2, 3, 4, 5].map((id) => attempt(String(id), true, 'sure')), datasets: [dataset], course, now: new Date('2026-07-15T12:00:00.000Z') });
    expect(ready.find((item) => item.objectiveId === 'responsible-ai')).toMatchObject({ score: 100, evidence: 5, status: 'ready' });
  });

  it('prioritises confidently wrong misconceptions for revision', () => {
    const mastery = calculateCertificationMastery({ examCode: 'AI-901', attempts: [attempt('wrong', false, 'sure')], datasets: [dataset], course, now: new Date('2026-07-15T12:00:00.000Z') });
    expect(selectStudyRecommendation(mastery)).toMatchObject({ kind: 'revision', objectiveId: 'responsible-ai' });
  });

  it('discounts readiness while objective evidence is sparse', () => {
    const mastery = calculateCertificationMastery({ examCode: 'AI-901', attempts: [attempt('1', true)], datasets: [dataset], course, now: new Date('2026-07-15T12:00:00.000Z') });
    expect(certificationReadiness(mastery)).toBeLessThan(20);
  });
});
