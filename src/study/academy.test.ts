import { describe, expect, it } from 'vitest';
import type { PublicDataset, QuizItem } from '../../shared/quiz';
import { getRevisionCourse } from '../revision/registry';
import type { ObjectiveMastery } from './types';
import {
  buildAcademyCampaign,
  buildAcademyQuests,
  createAcademyChallengeConfig,
  domainChallengeId,
  localWeekKey,
  selectAcademyMapPosition
} from './academy';
import { buildCertificationPool } from './pool';

describe('Arcade Academy campaign', () => {
  const course = getRevisionCourse('AI-901')!;

  it('derives stage stars from revision and mastery evidence', () => {
    const page = course.pages[0];
    const mastery: ObjectiveMastery[] = [{
      objectiveId: page.objectiveId,
      title: page.title,
      domainId: page.domainId,
      domainTitle: course.domains[0].title,
      blueprintWeight: 10,
      score: 85,
      evidence: 5,
      confidentWrong: 0,
      status: 'ready'
    }];

    const campaign = buildAcademyCampaign({
      course,
      mastery,
      reviewedPageIds: new Set([page.id]),
      challenges: {}
    });

    expect(campaign.zones[0].stages[0]).toMatchObject({
      earnedStars: 3,
      stars: { studied: true, practised: true, mastered: true }
    });
    expect(campaign.totalStars).toBe(course.pages.length * 3);
    expect(selectAcademyMapPosition(campaign, page.objectiveId)?.stage.objectiveId).toBe(page.objectiveId);
    expect(selectAcademyMapPosition(campaign)?.stage.objectiveId).toBe(course.pages[1].objectiveId);
  });

  it('builds deterministic daily and Monday-based weekly quests', () => {
    const now = new Date(2026, 6, 22, 12);
    const quests = buildAcademyQuests({
      examCode: 'AI-901',
      now,
      weakObjectiveId: 'responsible-ai',
      weakObjectiveTitle: 'Responsible AI',
      unreviewedGuideCount: 1
    });

    expect(quests).toHaveLength(6);
    expect(quests.filter((quest) => quest.period === 'daily').map((quest) => quest.kind)).toEqual(['answer', 'correct', 'guide']);
    expect(quests.filter((quest) => quest.period === 'weekly')[0].periodKey).toBe(localWeekKey(now));
    expect(buildAcademyQuests({ examCode: 'AI-901', now, unreviewedGuideCount: 1 })).toEqual(
      buildAcademyQuests({ examCode: 'AI-901', now, unreviewedGuideCount: 1 })
    );
  });

  it('selects a balanced domain boss and records its stable challenge identity', () => {
    const pool = buildCertificationPool('AI-901', [datasetWithObjectives('AI-901', 'domain-a', ['one', 'two', 'three'], 8)]);
    const config = createAcademyChallengeConfig({
      examCode: 'AI-901',
      pool,
      kind: 'domain-boss',
      domainId: 'domain-a',
      now: new Date('2026-07-22T12:00:00.000Z')
    })!;
    const byKey = new Map(pool.map((item) => [item.key, item]));
    const counts = config.questionKeys.reduce<Record<string, number>>((result, key) => {
      const objective = byKey.get(key)?.item.objectiveId ?? '';
      result[objective] = (result[objective] ?? 0) + 1;
      return result;
    }, {});

    expect(config.questionKeys).toHaveLength(12);
    expect(config.challengeId).toBe(domainChallengeId('AI-901', 'domain-a'));
    expect(Object.values(counts)).toEqual([4, 4, 4]);
  });
});

function datasetWithObjectives(examCode: string, domainId: string, objectives: string[], perObjective: number): PublicDataset {
  const items: QuizItem[] = objectives.flatMap((objectiveId) => Array.from({ length: perObjective }, (_, index) => ({
    id: `${objectiveId}-${index}`,
    type: 'multiple-choice' as const,
    prompt: `${objectiveId} question ${index}`,
    answer: 'A',
    options: ['A', 'B'],
    objectiveId,
    domainId
  })));
  return {
    id: `builtin-${examCode.toLowerCase()}-test`,
    slug: 'test',
    title: 'Test',
    kind: 'exam',
    curated: true,
    examCode,
    blueprintVersion: '2026',
    domains: [{ id: domainId, title: 'Domain', weight: 100 }],
    items,
    itemCount: items.length,
    createdAt: '2026-01-01T00:00:00.000Z'
  };
}
