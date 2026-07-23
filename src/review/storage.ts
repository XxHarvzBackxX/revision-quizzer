import { useEffect, useState } from 'react';
import type { PublicDataset, QuizItem } from '../../shared/quiz';
import { readAppStorage, writeAppStorage } from '../persistence';
import type { AttemptRecord, StudyConfidence } from '../storage';
import type { ReviewRecord, ReviewSession, ReviewState, ReviewStatus } from './types';

export const REVIEW_STORAGE_KEY = 'quiz-arcade:review:v1';
export const REVIEW_EVENT = 'quiz-arcade:review-changed';
export const MAX_REVIEW_RECORDS = 300;
const PROMPT_LIMIT = 240;
const NOTE_LIMIT = 300;

export function emptyReviewState(): ReviewState {
  return { version: 1, records: {} };
}

export function getReviewState(): ReviewState {
  try {
    const raw = readAppStorage(REVIEW_STORAGE_KEY);
    return raw ? normalizeReviewState(JSON.parse(raw)) : emptyReviewState();
  } catch {
    return emptyReviewState();
  }
}

export function saveReviewState(state: ReviewState): ReviewState {
  const normalized = normalizeReviewState(state);
  try {
    writeAppStorage(REVIEW_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(REVIEW_EVENT));
  } catch {
    // Review should never prevent a learner from continuing a quiz.
  }
  return normalized;
}

export function reviewQuestionIdentity(dataset: PublicDataset, item: QuizItem, questionIndex: number) {
  const datasetId = item.sourceDatasetId ?? dataset.id;
  const datasetSlug = item.sourceDatasetSlug ?? dataset.slug;
  const questionId = item.sourceQuestionId ?? item.id ?? `index-${questionIndex}`;
  return { key: `${datasetId}/${questionId}`, datasetId, datasetSlug, questionId };
}

export function recordReviewResponse({
  dataset,
  item,
  questionIndex,
  correct,
  confidence,
  answeredAt = new Date()
}: {
  dataset: PublicDataset;
  item: QuizItem;
  questionIndex: number;
  correct: boolean;
  confidence?: StudyConfidence;
  answeredAt?: Date;
}): ReviewState {
  const identity = reviewQuestionIdentity(dataset, item, questionIndex);
  const state = getReviewState();
  const existing = state.records[identity.key];
  if (correct && (!existing || existing.correctStreak >= 2 || !isReviewDue(existing, answeredAt))) return state;

  const answeredAtIso = answeredAt.toISOString();
  let record: ReviewRecord;
  if (!correct) {
    record = {
      ...reviewRecordMetadata(dataset, item, questionIndex),
      ...existing,
      ...reviewRecordMetadata(dataset, item, questionIndex),
      firstWrongAt: existing?.firstWrongAt ?? answeredAtIso,
      lastWrongAt: answeredAtIso,
      wrongCount: (existing?.wrongCount ?? 0) + 1,
      ...(confidence ? { lastConfidence: confidence } : {}),
      correctStreak: 0,
      dueOn: addLocalDays(answeredAt, 1),
      available: true
    };
    delete record.recoveredAt;
    delete record.lastCorrectAt;
  } else {
    const nextStreak = existing.correctStreak + 1 as 1 | 2;
    record = {
      ...existing,
      correctStreak: nextStreak,
      lastCorrectAt: answeredAtIso,
      available: true,
      ...(nextStreak === 2
        ? { recoveredAt: answeredAtIso, dueOn: undefined }
        : { dueOn: addLocalDays(answeredAt, 3), recoveredAt: undefined })
    };
  }

  return saveReviewState({ ...state, records: trimRecords({ ...state.records, [record.key]: record }) });
}

export function recordAttemptForReview(dataset: PublicDataset, attempt: AttemptRecord, completedAt = new Date(attempt.completedAt)): ReviewState {
  let state = getReviewState();
  for (const answer of attempt.answers) {
    const item = resolveAttemptItem(dataset, answer);
    if (!item || !answer.response.some(Boolean)) continue;
    state = recordReviewResponse({
      dataset,
      item,
      questionIndex: answer.questionIndex,
      correct: answer.correct,
      confidence: answer.confidence,
      answeredAt: completedAt
    });
  }
  return state;
}

export function importReviewHistory(attempts: AttemptRecord[], datasets: PublicDataset[], importedAt = new Date()): ReviewState {
  const current = getReviewState();
  if (current.historyImportedAt) return current;
  const byId = new Map(datasets.map((dataset) => [dataset.id, dataset]));
  const records: Record<string, ReviewRecord> = { ...current.records };

  for (const attempt of [...attempts].sort((left, right) => left.completedAt.localeCompare(right.completedAt))) {
    for (const answer of attempt.answers) {
      if (!answer.response.some(Boolean)) continue;
      const sourceId = answer.sourceDatasetId ?? attempt.datasetId;
      const dataset = byId.get(sourceId);
      const item = dataset && resolveHistoricalItem(dataset, answer);
      const questionId = answer.sourceQuestionId ?? answer.questionId ?? `index-${answer.questionIndex}`;
      const key = `${sourceId}/${questionId}`;
      const existing = records[key];
      const metadata = dataset && item
        ? reviewRecordMetadata(dataset, item, answer.questionIndex)
        : {
            key,
            datasetId: sourceId,
            datasetSlug: answer.sourceDatasetSlug ?? attempt.slug,
            datasetTitle: attempt.title,
            questionId,
            questionIndex: answer.questionIndex,
            prompt: `Question ${answer.questionIndex + 1} from ${attempt.title}`,
            ...(attempt.examCode ? { examCode: attempt.examCode } : {}),
            ...(answer.objectiveId ? { objectiveId: answer.objectiveId } : {}),
            ...(answer.domainId ? { domainId: answer.domainId } : {}),
            available: false
          };
      if (!answer.correct) {
        records[key] = {
          ...metadata,
          ...existing,
          ...metadata,
          firstWrongAt: existing?.firstWrongAt ?? attempt.completedAt,
          lastWrongAt: attempt.completedAt,
          wrongCount: (existing?.wrongCount ?? 0) + 1,
          ...(answer.confidence ? { lastConfidence: answer.confidence } : {}),
          correctStreak: 0,
          dueOn: addLocalDays(new Date(attempt.completedAt), 1),
          available: Boolean(dataset && item)
        };
        delete records[key].recoveredAt;
        delete records[key].lastCorrectAt;
      } else if (existing && isReviewDue(existing, new Date(attempt.completedAt))) {
        const nextStreak = existing.correctStreak + 1 as 1 | 2;
        records[key] = {
          ...existing,
          correctStreak: nextStreak,
          lastCorrectAt: attempt.completedAt,
          ...(nextStreak === 2
            ? { recoveredAt: attempt.completedAt, dueOn: undefined }
            : { dueOn: addLocalDays(new Date(attempt.completedAt), 3), recoveredAt: undefined })
        };
      }
    }
  }

  const dueOn = localDateKey(importedAt);
  const importedRecords = Object.fromEntries(Object.entries(records).map(([key, record]) => [
    key,
    record.correctStreak < 2 ? { ...record, dueOn } : record
  ]));
  return saveReviewState({ version: 1, records: trimRecords(importedRecords), historyImportedAt: importedAt.toISOString() });
}

export function setReviewSourceAvailability(availableDatasetIds: Set<string>): ReviewState {
  const state = getReviewState();
  let changed = false;
  const records = Object.fromEntries(Object.entries(state.records).map(([key, record]) => {
    const available = availableDatasetIds.has(record.datasetId);
    if (available !== record.available) changed = true;
    return [key, available === record.available ? record : { ...record, available }];
  }));
  return changed ? saveReviewState({ ...state, records }) : state;
}

export function saveReviewNote(key: string, note: string): ReviewState {
  const state = getReviewState();
  const record = state.records[key];
  if (!record) return state;
  const clean = note.trim().slice(0, NOTE_LIMIT);
  return saveReviewState({
    ...state,
    records: { ...state.records, [key]: { ...record, ...(clean ? { note: clean } : { note: undefined }) } }
  });
}

export function removeReviewRecord(key: string): ReviewState {
  const state = getReviewState();
  const records = { ...state.records };
  delete records[key];
  return saveReviewState({ ...state, records });
}

export function beginReviewSession(questionKeys: string[], now = new Date()): ReviewState {
  const state = getReviewState();
  const session: ReviewSession = { id: `mistakes-${now.getTime()}`, questionKeys: questionKeys.slice(0, 20), createdAt: now.toISOString() };
  return saveReviewState({ ...state, activeSession: session });
}

export function reviewStatus(record: ReviewRecord, now = new Date()): ReviewStatus {
  if (!record.available) return 'unavailable';
  if (record.correctStreak >= 2) return 'recovered';
  return isReviewDue(record, now) ? 'due' : 'scheduled';
}

export function isReviewDue(record: ReviewRecord, now = new Date()): boolean {
  return Boolean(record.available && record.correctStreak < 2 && record.dueOn && record.dueOn <= localDateKey(now));
}

export function selectDueReviewRecords(records: ReviewRecord[], count: number, now = new Date()): ReviewRecord[] {
  return records.filter((record) => isReviewDue(record, now)).sort((left, right) => (
    confidencePriority(right.lastConfidence) - confidencePriority(left.lastConfidence)
    || (left.dueOn ?? '').localeCompare(right.dueOn ?? '')
    || right.wrongCount - left.wrongCount
    || left.lastWrongAt.localeCompare(right.lastWrongAt)
  )).slice(0, Math.max(1, Math.min(20, count)));
}

export function useReviewState(): ReviewState {
  const [state, setState] = useState<ReviewState>(() => getReviewState());
  useEffect(() => {
    const update = () => setState(getReviewState());
    const onStorage = (event: StorageEvent) => { if (event.key === REVIEW_STORAGE_KEY) update(); };
    window.addEventListener(REVIEW_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(REVIEW_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return state;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function reviewRecordMetadata(dataset: PublicDataset, item: QuizItem, questionIndex: number) {
  const identity = reviewQuestionIdentity(dataset, item, questionIndex);
  return {
    ...identity,
    datasetTitle: dataset.title,
    questionIndex,
    prompt: item.prompt.slice(0, PROMPT_LIMIT),
    ...(dataset.examCode ? { examCode: dataset.examCode.toUpperCase() } : {}),
    ...(item.objectiveId ? { objectiveId: item.objectiveId } : {}),
    ...(item.domainId ? { domainId: item.domainId } : {}),
    ...(dataset.contentRevision ? { contentRevision: dataset.contentRevision } : {}),
    available: true
  };
}

function resolveAttemptItem(dataset: PublicDataset, answer: AttemptRecord['answers'][number]): QuizItem | undefined {
  const questionId = answer.sourceQuestionId ?? answer.questionId;
  return (questionId ? dataset.items.find((item) => (item.sourceQuestionId ?? item.id) === questionId) : undefined) ?? dataset.items[answer.questionIndex];
}

function resolveHistoricalItem(dataset: PublicDataset, answer: AttemptRecord['answers'][number]): QuizItem | undefined {
  const questionId = answer.sourceQuestionId ?? answer.questionId;
  return (questionId ? dataset.items.find((item) => item.id === questionId) : undefined) ?? dataset.items[answer.questionIndex];
}

function addLocalDays(date: Date, days: number): string {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return localDateKey(next);
}

function confidencePriority(confidence?: StudyConfidence): number {
  if (confidence === 'sure') return 3;
  if (confidence === 'unsure') return 2;
  if (confidence === 'guess') return 1;
  return 0;
}

function trimRecords(records: Record<string, ReviewRecord>): Record<string, ReviewRecord> {
  const values = Object.values(records);
  if (values.length <= MAX_REVIEW_RECORDS) return records;
  const ranked = [...values].sort((left, right) => {
    const leftPriority = left.correctStreak >= 2 ? 2 : !left.available ? 1 : 0;
    const rightPriority = right.correctStreak >= 2 ? 2 : !right.available ? 1 : 0;
    return leftPriority - rightPriority || right.lastWrongAt.localeCompare(left.lastWrongAt);
  }).slice(0, MAX_REVIEW_RECORDS);
  return Object.fromEntries(ranked.map((record) => [record.key, record]));
}

function normalizeReviewState(value: unknown): ReviewState {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.records)) return emptyReviewState();
  const records = Object.fromEntries(Object.entries(value.records).flatMap(([key, candidate]) => {
    const record = normalizeRecord(candidate);
    return record && record.key === key ? [[key, record]] : [];
  }));
  const activeSession = normalizeSession(value.activeSession);
  return {
    version: 1,
    records: trimRecords(records),
    ...(activeSession ? { activeSession } : {}),
    ...(typeof value.historyImportedAt === 'string' ? { historyImportedAt: value.historyImportedAt } : {})
  };
}

function normalizeRecord(value: unknown): ReviewRecord | null {
  if (!isRecord(value)) return null;
  const strings = ['key', 'datasetId', 'datasetSlug', 'datasetTitle', 'questionId', 'prompt', 'firstWrongAt', 'lastWrongAt'] as const;
  if (!strings.every((key) => typeof value[key] === 'string')) return null;
  const correctStreak = value.correctStreak === 1 || value.correctStreak === 2 ? value.correctStreak : 0;
  return {
    key: value.key,
    datasetId: value.datasetId,
    datasetSlug: value.datasetSlug,
    datasetTitle: value.datasetTitle.slice(0, 120),
    questionId: value.questionId,
    questionIndex: safeCount(value.questionIndex),
    prompt: value.prompt.slice(0, PROMPT_LIMIT),
    ...(typeof value.examCode === 'string' ? { examCode: value.examCode.toUpperCase() } : {}),
    ...(typeof value.objectiveId === 'string' ? { objectiveId: value.objectiveId } : {}),
    ...(typeof value.domainId === 'string' ? { domainId: value.domainId } : {}),
    ...(typeof value.contentRevision === 'string' ? { contentRevision: value.contentRevision } : {}),
    firstWrongAt: value.firstWrongAt,
    lastWrongAt: value.lastWrongAt,
    wrongCount: Math.max(1, safeCount(value.wrongCount)),
    ...(value.lastConfidence === 'sure' || value.lastConfidence === 'unsure' || value.lastConfidence === 'guess' ? { lastConfidence: value.lastConfidence } : {}),
    correctStreak,
    ...(typeof value.dueOn === 'string' ? { dueOn: value.dueOn } : {}),
    ...(typeof value.lastCorrectAt === 'string' ? { lastCorrectAt: value.lastCorrectAt } : {}),
    ...(typeof value.recoveredAt === 'string' ? { recoveredAt: value.recoveredAt } : {}),
    available: value.available !== false,
    ...(typeof value.note === 'string' && value.note.trim() ? { note: value.note.trim().slice(0, NOTE_LIMIT) } : {})
  };
}

function normalizeSession(value: unknown): ReviewSession | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.createdAt !== 'string' || !Array.isArray(value.questionKeys)) return null;
  const questionKeys = value.questionKeys.filter((item): item is string => typeof item === 'string').slice(0, 20);
  return questionKeys.length ? { id: value.id, createdAt: value.createdAt, questionKeys } : null;
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
