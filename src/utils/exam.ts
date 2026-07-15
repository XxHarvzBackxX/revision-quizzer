import type { PublicDataset, QuizItem } from '../../shared/quiz';
import { isObjectiveItem, isResponseCorrect } from '../../shared/quiz';
import type { ActiveExamSession, AttemptAnswer, AttemptRecord, DomainResult, QuizMode } from '../storage';

export type OrderedQuestion = {
  originalIndex: number;
  item: QuizItem;
  options: string[];
};

export function createExamSession(dataset: PublicDataset, now = new Date()): ActiveExamSession {
  const seed = `${dataset.id}:${now.toISOString()}`;
  const itemOrder = dataset.items.map((_, index) => index);
  if (dataset.shuffleQuestions) seededShuffle(itemOrder, `${seed}:questions`);

  const optionOrders: Record<string, string[]> = {};
  dataset.items.forEach((item, index) => {
    if (!isObjectiveItem(item)) return;
    optionOrders[String(index)] = seededShuffle([...item.options], `${seed}:options:${index}`);
  });

  return {
    version: 1,
    datasetId: dataset.id,
    slug: dataset.slug,
    title: dataset.title,
    itemOrder,
    optionOrders,
    answers: {},
    confidence: {},
    activityRecorded: [],
    flags: [],
    currentIndex: 0,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + (dataset.durationMinutes ?? 45) * 60_000).toISOString()
  };
}

export function getOrderedQuestions(dataset: PublicDataset, session: ActiveExamSession): OrderedQuestion[] {
  return session.itemOrder.flatMap((originalIndex) => {
    const item = dataset.items[originalIndex];
    if (!item) return [];
    return [{
      originalIndex,
      item,
      options: isObjectiveItem(item) ? session.optionOrders[String(originalIndex)] ?? item.options : []
    }];
  });
}

export function buildAttempt({
  dataset,
  mode,
  session,
  completedAt = new Date(),
  expired = false
}: {
  dataset: PublicDataset;
  mode: QuizMode;
  session: ActiveExamSession;
  completedAt?: Date;
  expired?: boolean;
}): AttemptRecord {
  const answers: AttemptAnswer[] = session.itemOrder.map((questionIndex) => {
    const item = dataset.items[questionIndex];
    const response = session.answers[String(questionIndex)] ?? [];
    return {
      questionIndex,
      questionId: item?.id,
      response,
      correct: item ? isResponseCorrect(item, response) : false,
      flagged: session.flags.includes(questionIndex),
      domainId: item?.domainId,
      objectiveId: item?.objectiveId,
      confidence: session.confidence?.[String(questionIndex)],
      sourceDatasetId: item?.sourceDatasetId,
      sourceDatasetSlug: item?.sourceDatasetSlug,
      sourceQuestionId: item?.sourceQuestionId
    };
  });
  const score = answers.filter((answer) => answer.correct).length;
  const total = answers.length;
  const startedAt = new Date(session.startedAt);
  const finishedAt = completedAt < startedAt ? startedAt : completedAt;

  return {
    version: 2,
    id: `${dataset.id}-${mode}-${finishedAt.getTime()}`,
    datasetId: dataset.id,
    slug: dataset.slug,
    title: dataset.title,
    mode,
    score,
    total,
    percentage: total ? Math.round((score / total) * 100) : 0,
    readinessTarget: dataset.readinessTarget ?? 70,
    startedAt: startedAt.toISOString(),
    completedAt: finishedAt.toISOString(),
    durationSeconds: Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)),
    expired,
    answers,
    domains: calculateDomainResults(answers),
    examCode: dataset.examCode
  };
}

export function calculateDomainResults(answers: AttemptAnswer[]): DomainResult[] {
  const byDomain = new Map<string, DomainResult>();
  for (const answer of answers) {
    if (!answer.domainId) continue;
    const result = byDomain.get(answer.domainId) ?? { domainId: answer.domainId, correct: 0, total: 0 };
    result.total += 1;
    if (answer.correct) result.correct += 1;
    byDomain.set(answer.domainId, result);
  }
  return [...byDomain.values()];
}

export function formatRemainingTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function seededShuffle<T>(values: T[], seed: string): T[] {
  const random = mulberry32(hashString(seed));
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
