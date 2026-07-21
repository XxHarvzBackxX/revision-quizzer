import type { PublicDataset } from '../../shared/quiz';
import type { RevisionCourse } from '../revision/types';
import { seededShuffle } from '../utils/exam';
import type {
  AcademyChallengeProgress,
  AcademyQuest,
  AcademyQuestKind,
  ObjectiveMastery,
  StudyDrillConfig
} from './types';
import type { StudyPoolItem } from './pool';

export const DOMAIN_BOSS_QUESTION_COUNT = 12;
export const FINAL_BOSS_QUESTION_COUNT = 25;
export const BOSS_PASS_PERCENTAGE = 80;

export type AcademyStage = {
  id: string;
  title: string;
  summary: string;
  objectiveId: string;
  pageSlug: string;
  stars: {
    studied: boolean;
    practised: boolean;
    mastered: boolean;
  };
  earnedStars: number;
  mastery: ObjectiveMastery;
};

export type AcademyZone = {
  id: string;
  title: string;
  weight: number;
  stages: AcademyStage[];
  boss: AcademyChallengeProgress | undefined;
};

export type AcademyCampaign = {
  examCode: string;
  title: string;
  zones: AcademyZone[];
  finalBoss: AcademyChallengeProgress | undefined;
  earnedStars: number;
  totalStars: number;
  passedBosses: number;
};

export type AcademyStageLocation = {
  zone: AcademyZone;
  stage: AcademyStage;
  zoneIndex: number;
  stageIndex: number;
};

export type AcademyQuestContext = {
  examCode: string;
  now?: Date;
  weakObjectiveId?: string;
  weakObjectiveTitle?: string;
  unreviewedGuideCount?: number;
  bookmarkCount?: number;
};

type QuestTemplate = {
  key: string;
  kind: AcademyQuestKind;
  title: string;
  description: string;
  target: number;
  objectiveId?: string;
};

export const academyCosmetics = {
  titles: [
    { id: 'title-new-challenger', label: 'New Challenger' },
    { id: 'title-objective-hunter', label: 'Objective Hunter' },
    { id: 'title-domain-champion', label: 'Domain Champion' },
    { id: 'title-certification-conqueror', label: 'Certification Conqueror' }
  ],
  tokens: [
    { id: 'token-brain', label: 'Brain' },
    { id: 'token-bolt', label: 'Bolt' },
    { id: 'token-crown', label: 'Crown' }
  ]
} as const;

export function academyTitleLabel(id: string): string {
  return academyCosmetics.titles.find((item) => item.id === id)?.label ?? 'New Challenger';
}

export function findAcademyStage(campaign: AcademyCampaign, objectiveId?: string): AcademyStageLocation | undefined {
  if (!objectiveId) return undefined;
  for (const [zoneIndex, zone] of campaign.zones.entries()) {
    const stageIndex = zone.stages.findIndex((stage) => stage.objectiveId === objectiveId);
    if (stageIndex >= 0) return { zone, stage: zone.stages[stageIndex], zoneIndex, stageIndex };
  }
  return undefined;
}

export function selectAcademyMapPosition(campaign: AcademyCampaign, preferredObjectiveId?: string): AcademyStageLocation | undefined {
  const preferred = findAcademyStage(campaign, preferredObjectiveId);
  if (preferred) return preferred;
  for (const [zoneIndex, zone] of campaign.zones.entries()) {
    const stageIndex = zone.stages.findIndex((stage) => !stage.stars.mastered);
    if (stageIndex >= 0) return { zone, stage: zone.stages[stageIndex], zoneIndex, stageIndex };
  }
  const zoneIndex = campaign.zones.length - 1;
  const zone = campaign.zones[zoneIndex];
  const stageIndex = (zone?.stages.length ?? 0) - 1;
  return zone && stageIndex >= 0 ? { zone, stage: zone.stages[stageIndex], zoneIndex, stageIndex } : undefined;
}

export function buildAcademyCampaign({
  course,
  mastery,
  reviewedPageIds,
  challenges
}: {
  course: RevisionCourse;
  mastery: ObjectiveMastery[];
  reviewedPageIds: Set<string>;
  challenges: Record<string, AcademyChallengeProgress>;
}): AcademyCampaign {
  const byObjective = new Map(mastery.map((item) => [item.objectiveId, item]));
  const zones = course.domains.map<AcademyZone>((domain) => ({
    ...domain,
    stages: course.pages.filter((page) => page.domainId === domain.id).map((page) => {
      const objective = byObjective.get(page.objectiveId) ?? emptyMastery(page.objectiveId, page.title, domain.id, domain.title, domain.weight);
      const stars = {
        studied: reviewedPageIds.has(page.id),
        practised: objective.evidence >= 5,
        mastered: objective.evidence >= 5 && objective.score >= 80
      };
      return {
        id: page.id,
        title: page.title,
        summary: page.summary,
        objectiveId: page.objectiveId,
        pageSlug: page.slug,
        stars,
        earnedStars: Object.values(stars).filter(Boolean).length,
        mastery: objective
      };
    }),
    boss: challenges[domainChallengeId(course.examCode, domain.id)]
  }));
  const earnedStars = zones.flatMap((zone) => zone.stages).reduce((sum, stage) => sum + stage.earnedStars, 0);
  return {
    examCode: course.examCode,
    title: course.shortTitle,
    zones,
    finalBoss: challenges[finalChallengeId(course.examCode)],
    earnedStars,
    totalStars: course.pages.length * 3,
    passedBosses: zones.filter((zone) => zone.boss?.passedAt).length
  };
}

export function buildAcademyQuests(context: AcademyQuestContext): AcademyQuest[] {
  const now = context.now ?? new Date();
  const examCode = context.examCode.toUpperCase();
  const dailyKey = localDateKey(now);
  const weeklyKey = localWeekKey(now);
  const daily = [
    template('daily-answer', 'answer', 'Warm-up run', 'Answer 5 questions in this certification.', 5),
    template('daily-correct', 'correct', 'Accuracy streak', 'Get 4 answers correct in this certification.', 4),
    contextualDailyTemplate(context)
  ].map((item, slot) => questFromTemplate(examCode, 'daily', dailyKey, slot, item));
  const weekly = [
    template('weekly-answer', 'answer', 'Weekly marathon', 'Answer 30 questions in this certification.', 30),
    template('weekly-drill', 'drill', 'Training circuit', 'Complete 3 targeted drills.', 3),
    contextualWeeklyTemplate(context)
  ].map((item, slot) => questFromTemplate(examCode, 'weekly', weeklyKey, slot, item));
  return [...daily, ...weekly];
}

export function buildRerollQuest(
  current: AcademyQuest,
  active: AcademyQuest[],
  context: AcademyQuestContext
): AcademyQuest | null {
  if (current.period !== 'daily' || current.completedAt || current.replacedBy || current.rerolledFrom) return null;
  const used = new Set(active.filter((quest) => !quest.replacedBy).map((quest) => quest.kind === 'objective' ? `${quest.kind}:${quest.objectiveId}` : quest.kind));
  const candidates = [
    template('reroll-drill', 'drill', 'Quick circuit', 'Complete 1 targeted drill.', 1),
    template('reroll-guide', 'guide', 'Knowledge pickup', 'Review 1 RevisionWiki guide.', 1),
    ...(context.bookmarkCount && context.bookmarkCount >= 2
      ? [template('reroll-bookmarks', 'bookmarked', 'Saved-question sweep', 'Answer 2 bookmarked questions.', 2)]
      : []),
    ...(context.weakObjectiveId
      ? [template('reroll-objective', 'objective', `Repair ${context.weakObjectiveTitle ?? 'a weak objective'}`, 'Answer 3 questions from your weakest objective.', 3, context.weakObjectiveId)]
      : []),
    template('reroll-correct', 'correct', 'Clean run', 'Get 3 answers correct.', 3),
    template('reroll-answer', 'answer', 'Bonus round', 'Answer 4 questions.', 4)
  ].filter((item) => !used.has(item.kind === 'objective' ? `${item.kind}:${item.objectiveId}` : item.kind));
  if (!candidates.length) return null;
  const [selected] = seededShuffle(candidates, `${current.id}:reroll`);
  const replacement = questFromTemplate(current.examCode, 'daily', current.periodKey, current.slot, selected);
  return { ...replacement, id: `${replacement.id}:r`, rerolledFrom: current.id };
}

export function createAcademyChallengeConfig({
  examCode,
  pool,
  kind,
  domainId,
  now = new Date()
}: {
  examCode: string;
  pool: StudyPoolItem[];
  kind: 'domain-boss' | 'final-boss';
  domainId?: string;
  now?: Date;
}): StudyDrillConfig | null {
  const code = examCode.toUpperCase();
  const seed = `academy-${kind}-${domainId ?? 'final'}-${now.getTime()}`;
  const selected = kind === 'domain-boss'
    ? selectBalancedDomainQuestions(pool.filter((item) => item.item.domainId === domainId), DOMAIN_BOSS_QUESTION_COUNT, seed)
    : selectBlueprintQuestions(pool, FINAL_BOSS_QUESTION_COUNT, seed);
  if (!selected.length) return null;
  return {
    examCode: code,
    filter: 'all',
    mode: kind,
    challengeId: kind === 'domain-boss' && domainId ? domainChallengeId(code, domainId) : finalChallengeId(code),
    ...(domainId ? { domainId } : {}),
    count: selected.length,
    questionKeys: selected.map((item) => item.key),
    seed,
    createdAt: now.toISOString()
  };
}

export function domainChallengeId(examCode: string, domainId: string): string {
  return `${examCode.toUpperCase()}:domain:${domainId}`;
}

export function finalChallengeId(examCode: string): string {
  return `${examCode.toUpperCase()}:final`;
}

export function localWeekKey(date = new Date()): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return localDateKey(day);
}

function contextualDailyTemplate(context: AcademyQuestContext): QuestTemplate {
  if ((context.unreviewedGuideCount ?? 0) > 0) return template('daily-guide', 'guide', 'Knowledge pickup', 'Review 1 RevisionWiki guide.', 1);
  if ((context.bookmarkCount ?? 0) >= 2) return template('daily-bookmarks', 'bookmarked', 'Saved-question sweep', 'Answer 2 bookmarked questions.', 2);
  if (context.weakObjectiveId) return template('daily-objective', 'objective', `Repair ${context.weakObjectiveTitle ?? 'a weak objective'}`, 'Answer 3 questions from your weakest objective.', 3, context.weakObjectiveId);
  return template('daily-drill', 'drill', 'Quick circuit', 'Complete 1 targeted drill.', 1);
}

function contextualWeeklyTemplate(context: AcademyQuestContext): QuestTemplate {
  if ((context.unreviewedGuideCount ?? 0) >= 2) return template('weekly-guides', 'guide', 'Wiki expedition', 'Review 2 new RevisionWiki guides.', 2);
  if (context.weakObjectiveId) return template('weekly-objective', 'objective', `Mastery push: ${context.weakObjectiveTitle ?? 'weakest objective'}`, 'Answer 15 questions from your weakest objective.', 15, context.weakObjectiveId);
  return template('weekly-correct', 'correct', 'Precision week', 'Get 24 answers correct.', 24);
}

function template(key: string, kind: AcademyQuestKind, title: string, description: string, target: number, objectiveId?: string): QuestTemplate {
  return { key, kind, title, description, target, ...(objectiveId ? { objectiveId } : {}) };
}

function questFromTemplate(examCode: string, period: 'daily' | 'weekly', periodKey: string, slot: number, item: QuestTemplate): AcademyQuest {
  return {
    id: `${period}:${examCode}:${periodKey}:${slot}:${item.key}`,
    examCode,
    period,
    periodKey,
    slot,
    kind: item.kind,
    title: item.title,
    description: item.description,
    target: item.target,
    progress: 0,
    rewardXp: period === 'daily' ? 75 : 200,
    ...(item.objectiveId ? { objectiveId: item.objectiveId } : {})
  };
}

function selectBalancedDomainQuestions(pool: StudyPoolItem[], count: number, seed: string): StudyPoolItem[] {
  const groups = [...new Set(pool.map((item) => item.item.objectiveId).filter(Boolean) as string[])]
    .sort()
    .map((objectiveId) => seededShuffle(pool.filter((item) => item.item.objectiveId === objectiveId), `${seed}:${objectiveId}`));
  if (!groups.length) return seededShuffle(pool, seed).slice(0, count);
  const selected: StudyPoolItem[] = [];
  for (let round = 0; selected.length < count; round += 1) {
    let added = false;
    for (const group of groups) {
      const item = group[round];
      if (item && selected.length < count) {
        selected.push(item);
        added = true;
      }
    }
    if (!added) break;
  }
  return selected;
}

function selectBlueprintQuestions(pool: StudyPoolItem[], count: number, seed: string): StudyPoolItem[] {
  const domainIds = [...new Set(pool.map((item) => item.item.domainId).filter(Boolean) as string[])];
  if (!domainIds.length) return seededShuffle(pool, seed).slice(0, count);
  const allocations = domainIds.map((domainId) => {
    const items = pool.filter((item) => item.item.domainId === domainId);
    const weight = items[0]?.domainWeight ?? 100 / domainIds.length;
    return { domainId, items, exact: count * weight / 100, take: Math.floor(count * weight / 100) };
  });
  let remaining = count - allocations.reduce((sum, item) => sum + item.take, 0);
  for (const allocation of [...allocations].sort((left, right) => (right.exact % 1) - (left.exact % 1))) {
    if (remaining <= 0) break;
    allocation.take += 1;
    remaining -= 1;
  }
  const selected = allocations.flatMap((allocation) => (
    selectBalancedDomainQuestions(allocation.items, Math.min(allocation.take, allocation.items.length), `${seed}:${allocation.domainId}`)
  ));
  if (selected.length < count) {
    const used = new Set(selected.map((item) => item.key));
    selected.push(...seededShuffle(pool.filter((item) => !used.has(item.key)), `${seed}:fill`).slice(0, count - selected.length));
  }
  return seededShuffle(selected, `${seed}:final`).slice(0, count);
}

function emptyMastery(objectiveId: string, title: string, domainId: string, domainTitle: string, domainWeight: number): ObjectiveMastery {
  return { objectiveId, title, domainId, domainTitle, blueprintWeight: domainWeight, score: 0, evidence: 0, confidentWrong: 0, status: 'unseen' };
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function academyDatasetTitle(config: StudyDrillConfig, fallbackExamCode: string): Pick<PublicDataset, 'title' | 'description'> {
  if (config.mode === 'domain-boss') return { title: `${fallbackExamCode.toUpperCase()} Domain Boss`, description: 'An exam-style checkpoint across this campaign zone.' };
  if (config.mode === 'final-boss') return { title: `${fallbackExamCode.toUpperCase()} Final Boss`, description: 'A blueprint-weighted certification challenge.' };
  return { title: `${fallbackExamCode.toUpperCase()} Targeted Drill`, description: `${config.questionKeys.length} questions selected from the built-in mock papers.` };
}
