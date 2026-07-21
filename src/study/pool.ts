import type { Difficulty, PublicDataset, QuizItem } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import { seededShuffle } from '../utils/exam';
import { academyDatasetTitle } from './academy';
import { questionIdentity, questionKey } from './storage';
import type { ObjectiveMastery, StudyBookmark, StudyDrillConfig, StudyPoolFilter } from './types';

export type StudyPoolItem = {
  key: string;
  datasetId: string;
  datasetSlug: string;
  datasetTitle: string;
  domainTitle?: string;
  domainWeight?: number;
  blueprintVersion?: string;
  contentRevision?: string;
  questionId: string;
  item: QuizItem;
};

export function buildCertificationPool(examCode: string, datasets: PublicDataset[]): StudyPoolItem[] {
  const seen = new Set<string>();
  const seenPrompts = new Set<string>();
  return datasets
    .filter((dataset) => dataset.curated && dataset.id.startsWith('builtin-') && dataset.examCode?.toUpperCase() === examCode.toUpperCase())
    .flatMap((dataset) => dataset.items.flatMap((item, index) => {
      const identity = questionIdentity(dataset, item, index);
      const promptKey = item.prompt.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(identity.key) || seenPrompts.has(promptKey)) return [];
      seen.add(identity.key);
      seenPrompts.add(promptKey);
      const domain = dataset.domains?.find((entry) => entry.id === item.domainId);
      return [{ ...identity, datasetTitle: dataset.title, domainTitle: domain?.title, domainWeight: domain?.weight, blueprintVersion: dataset.blueprintVersion, contentRevision: dataset.contentRevision, item }];
    }));
}

export function filterStudyPool({
  pool,
  filter,
  objectiveId,
  domainId,
  difficulty,
  mastery,
  attempts,
  bookmarks
}: {
  pool: StudyPoolItem[];
  filter: StudyPoolFilter;
  objectiveId?: string;
  domainId?: string;
  difficulty?: Difficulty;
  mastery: ObjectiveMastery[];
  attempts: AttemptRecord[];
  bookmarks: Record<string, StudyBookmark>;
}): StudyPoolItem[] {
  let keys: Set<string> | undefined;
  let objectives: Set<string> | undefined;
  if (filter === 'missed') {
    keys = new Set(attempts.flatMap((attempt) => (Array.isArray(attempt.answers) ? attempt.answers : []).filter((answer) => !answer.correct).flatMap((answer) => {
      const datasetId = answer.sourceDatasetId ?? attempt.datasetId;
      const questionId = answer.sourceQuestionId ?? answer.questionId;
      return questionId ? [questionKey(datasetId, questionId)] : [];
    })));
  } else if (filter === 'bookmarked') {
    keys = new Set(Object.keys(bookmarks));
  } else if (filter === 'unseen') {
    objectives = new Set(mastery.filter((item) => item.status === 'unseen').map((item) => item.objectiveId));
  } else if (filter === 'weakest') {
    const measured = mastery.filter((item) => item.evidence > 0).sort((left, right) => left.score - right.score);
    const threshold = measured[0]?.score ?? 0;
    const weakest = measured.filter((item) => item.score <= Math.min(79, threshold + 10));
    objectives = new Set((weakest.length ? weakest : mastery.filter((item) => item.status === 'unseen')).map((item) => item.objectiveId));
  }
  return pool.filter((entry) => (
    (!keys || keys.has(entry.key))
    && (!objectives || objectives.has(entry.item.objectiveId ?? ''))
    && (!objectiveId || entry.item.objectiveId === objectiveId)
    && (!domainId || entry.item.domainId === domainId)
    && (!difficulty || entry.item.difficulty === difficulty)
  ));
}

export function selectDrillQuestionKeys(pool: StudyPoolItem[], count: number, seed: string): string[] {
  return seededShuffle(pool.map((item) => item.key), seed).slice(0, Math.max(1, Math.min(50, count)));
}

export function createStudyDataset(examCode: string, pool: StudyPoolItem[], config: StudyDrillConfig): PublicDataset {
  const byKey = new Map(pool.map((entry) => [entry.key, entry]));
  const selected = config.questionKeys.flatMap((key) => byKey.get(key) ?? []);
  const domains = uniqueDomains(selected);
  const copy = academyDatasetTitle(config, examCode);
  return {
    id: studyDatasetId(examCode, config.seed),
    slug: `study-${examCode.toLowerCase()}-${config.seed}`,
    title: copy.title,
    description: config.mode === 'domain-boss' || config.mode === 'final-boss'
      ? copy.description
      : `${selected.length} questions selected from the built-in ${examCode.toUpperCase()} mock papers.`,
    kind: config.mode === 'domain-boss' || config.mode === 'final-boss' ? 'exam' : 'quiz',
    curated: true,
    examCode: examCode.toUpperCase(),
    blueprintVersion: datasetsBlueprintVersion(selected),
    contentRevision: datasetsContentRevision(selected),
    readinessTarget: 80,
    durationMinutes: Math.max(10, Math.ceil(selected.length * 1.5)),
    shuffleQuestions: false,
    domains,
    items: selected.map((entry) => ({
      ...entry.item,
      sourceDatasetId: entry.datasetId,
      sourceDatasetSlug: entry.datasetSlug,
      sourceQuestionId: entry.questionId
    })),
    itemCount: selected.length,
    createdAt: config.createdAt,
    status: 'approved'
  };
}

export function studyDatasetId(examCode: string, seed: string): string {
  return `study-${examCode.toLowerCase().replace('-', '')}-${seed}`;
}

export function retryConfigFromAttempt(examCode: string, attempt: AttemptRecord): StudyDrillConfig | null {
  const questionKeys = attempt.answers.filter((answer) => !answer.correct).flatMap((answer) => {
    const datasetId = answer.sourceDatasetId ?? attempt.datasetId;
    const questionId = answer.sourceQuestionId ?? answer.questionId;
    return questionId ? [questionKey(datasetId, questionId)] : [];
  });
  if (!questionKeys.length) return null;
  const createdAt = new Date().toISOString();
  return { examCode: examCode.toUpperCase(), filter: 'missed', count: questionKeys.length, questionKeys, seed: String(Date.now()), createdAt };
}

function uniqueDomains(items: StudyPoolItem[]) {
  const ids = [...new Set(items.map((entry) => entry.item.domainId).filter(Boolean) as string[])];
  return ids.map((id) => {
    const source = items.find((entry) => entry.item.domainId === id);
    return { id, title: source?.domainTitle ?? humanize(id), weight: source?.domainWeight ?? Math.round(100 / Math.max(1, ids.length)) };
  });
}

function datasetsBlueprintVersion(items: StudyPoolItem[]): string {
  return [...new Set(items.map((item) => item.blueprintVersion).filter(Boolean))].join(' / ') || 'current';
}

function datasetsContentRevision(items: StudyPoolItem[]): string | undefined {
  const revisions = [...new Set(items.map((item) => item.contentRevision).filter(Boolean))];
  return revisions.length ? revisions.join(' / ') : undefined;
}

function humanize(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
