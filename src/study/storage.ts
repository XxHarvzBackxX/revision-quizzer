import { useEffect, useState } from 'react';
import type { QuizItem, PublicDataset } from '../../shared/quiz';
import type { StudyActivityDay, StudyBookmark, StudyDrillConfig, StudySettings, StudyStateV1 } from './types';

export const STUDY_STORAGE_KEY = 'quiz-arcade:study:v1';
const STUDY_EVENT = 'quiz-arcade:study-changed';
const DEFAULT_SETTINGS: StudySettings = { dailyQuestionGoal: 10, showExamConfidence: false };

export function emptyStudyState(): StudyStateV1 {
  return { version: 1, settings: DEFAULT_SETTINGS, bookmarks: {}, activity: {}, activeDrills: {} };
}

export function getStudyState(): StudyStateV1 {
  try {
    return normalizeStudyState(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? 'null')) ?? emptyStudyState();
  } catch {
    return emptyStudyState();
  }
}

export function saveStudyState(state: StudyStateV1): StudyStateV1 {
  const normalized = normalizeStudyState(state) ?? emptyStudyState();
  try {
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(STUDY_EVENT));
  } catch {
    // Study tools remain usable when storage is unavailable.
  }
  return normalized;
}

export function updateStudySettings(settings: Partial<StudySettings>): StudyStateV1 {
  const state = getStudyState();
  return saveStudyState({ ...state, settings: { ...state.settings, ...settings } });
}

export function questionKey(datasetId: string, questionId: string): string {
  return `${datasetId}/${questionId}`;
}

export function questionIdentity(dataset: PublicDataset, item: QuizItem, index: number) {
  const datasetId = item.sourceDatasetId ?? dataset.id;
  const datasetSlug = item.sourceDatasetSlug ?? dataset.slug;
  const questionId = item.sourceQuestionId ?? item.id ?? String(index);
  return { key: questionKey(datasetId, questionId), datasetId, datasetSlug, questionId };
}

export function toggleStudyBookmark(input: Omit<StudyBookmark, 'createdAt' | 'updatedAt'>): StudyStateV1 {
  const state = getStudyState();
  const bookmarks = { ...state.bookmarks };
  const existing = bookmarks[input.key];
  if (existing) delete bookmarks[input.key];
  else {
    const now = new Date().toISOString();
    bookmarks[input.key] = { ...input, createdAt: now, updatedAt: now };
  }
  return saveStudyState({ ...state, bookmarks });
}

export function saveBookmarkNote(input: Omit<StudyBookmark, 'createdAt' | 'updatedAt' | 'note'>, note: string): StudyStateV1 {
  const state = getStudyState();
  const now = new Date().toISOString();
  const existing = state.bookmarks[input.key];
  const clean = note.trim().slice(0, 500);
  return saveStudyState({
    ...state,
    bookmarks: {
      ...state.bookmarks,
      [input.key]: { ...input, createdAt: existing?.createdAt ?? now, updatedAt: now, ...(clean ? { note: clean } : {}) }
    }
  });
}

export function beginStudyDrill(config: StudyDrillConfig): StudyStateV1 {
  const state = getStudyState();
  return saveStudyState({ ...state, activeDrills: { ...state.activeDrills, [config.examCode.toUpperCase()]: config } });
}

export function getActiveStudyDrill(examCode: string): StudyDrillConfig | undefined {
  return getStudyState().activeDrills[examCode.toUpperCase()];
}

export function recordQuestionActivity(correct: boolean, date = new Date()): StudyStateV1 {
  return recordActivity({ questions: 1, correct: correct ? 1 : 0 }, date);
}

export function recordExamActivity(answers: Array<{ correct: boolean; response?: string[] }>, date = new Date()): StudyStateV1 {
  const answered = answers.filter((answer) => !answer.response || answer.response.some(Boolean));
  return recordActivity({ questions: answered.length, correct: answered.filter((answer) => answer.correct).length, exams: 1 }, date);
}

export function recordGuideReviewed(examCode: string, pageId: string, date = new Date()): StudyStateV1 {
  return recordActivity({ guide: `${examCode.toUpperCase()}/${pageId}` }, date);
}

export function studyTotals(state = getStudyState()): { xp: number; level: number; levelProgress: number } {
  const xp = Object.values(state.activity).reduce((sum, day) => sum + day.xp, 0);
  return { xp, level: Math.floor(xp / 500) + 1, levelProgress: xp % 500 };
}

export function studyStreak(state = getStudyState(), today = new Date()): { current: number; longest: number; completedToday: boolean } {
  const completed = new Set(Object.values(state.activity).filter((day) => day.goalAwarded).map((day) => day.date));
  const todayKey = localDateKey(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  let cursor = completed.has(todayKey) ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : yesterday;
  let current = 0;
  while (completed.has(localDateKey(cursor))) {
    current += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  const sorted = [...completed].sort();
  let longest = 0;
  let run = 0;
  let previous: Date | undefined;
  for (const key of sorted) {
    const date = parseLocalDate(key);
    const consecutive = previous && dayDifference(previous, date) === 1;
    run = consecutive ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return { current, longest, completedToday: completed.has(todayKey) };
}

export function useStudyState(): StudyStateV1 {
  const [state, setState] = useState<StudyStateV1>(() => getStudyState());
  useEffect(() => {
    const update = () => setState(getStudyState());
    const onStorage = (event: StorageEvent) => { if (event.key === STUDY_STORAGE_KEY) update(); };
    window.addEventListener(STUDY_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STUDY_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return state;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function recordActivity(input: { questions?: number; correct?: number; exams?: number; guide?: string }, date: Date): StudyStateV1 {
  const state = getStudyState();
  const key = localDateKey(date);
  const existing = state.activity[key] ?? emptyActivity(key);
  const guideIsNew = Boolean(input.guide && !existing.reviewedGuides.includes(input.guide));
  const questionsAnswered = existing.questionsAnswered + (input.questions ?? 0);
  const correctAnswers = existing.correctAnswers + (input.correct ?? 0);
  const examsSubmitted = existing.examsSubmitted + (input.exams ?? 0);
  const reviewedGuides = guideIsNew ? [...existing.reviewedGuides, input.guide as string] : existing.reviewedGuides;
  const baseXp = (input.questions ?? 0) * 5 + (input.correct ?? 0) * 5 + (guideIsNew ? 30 : 0);
  const completed = questionsAnswered >= state.settings.dailyQuestionGoal || examsSubmitted > 0 || reviewedGuides.length > 0;
  const goalBonus = completed && !existing.goalAwarded ? 50 : 0;
  const day: StudyActivityDay = {
    date: key,
    questionsAnswered,
    correctAnswers,
    examsSubmitted,
    reviewedGuides,
    xp: existing.xp + baseXp + goalBonus,
    goalAwarded: existing.goalAwarded || completed
  };
  return saveStudyState({ ...state, activity: { ...state.activity, [key]: day } });
}

function emptyActivity(date: string): StudyActivityDay {
  return { date, questionsAnswered: 0, correctAnswers: 0, examsSubmitted: 0, reviewedGuides: [], xp: 0, goalAwarded: false };
}

function normalizeStudyState(value: unknown): StudyStateV1 | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const settingsRecord = isRecord(value.settings) ? value.settings : {};
  const dailyQuestionGoal = [5, 10, 20, 30].includes(Number(settingsRecord.dailyQuestionGoal))
    ? Number(settingsRecord.dailyQuestionGoal) as StudySettings['dailyQuestionGoal']
    : 10;
  const bookmarks = isRecord(value.bookmarks) ? Object.fromEntries(Object.entries(value.bookmarks).flatMap(([key, entry]) => {
    const bookmark = normalizeBookmark(entry);
    return bookmark ? [[key, bookmark]] : [];
  })) : {};
  const activity = isRecord(value.activity) ? Object.fromEntries(Object.entries(value.activity).flatMap(([key, entry]) => {
    const day = normalizeActivity(entry);
    return day ? [[key, day]] : [];
  })) : {};
  const activeDrills = isRecord(value.activeDrills) ? Object.fromEntries(Object.entries(value.activeDrills).flatMap(([key, entry]) => {
    const config = normalizeDrill(entry);
    return config ? [[key.toUpperCase(), config]] : [];
  })) : {};
  return {
    version: 1,
    settings: { dailyQuestionGoal, showExamConfidence: Boolean(settingsRecord.showExamConfidence) },
    bookmarks,
    activity,
    activeDrills
  };
}

function normalizeBookmark(value: unknown): StudyBookmark | null {
  if (!isRecord(value)) return null;
  const required = ['key', 'examCode', 'datasetId', 'datasetSlug', 'questionId', 'prompt', 'createdAt', 'updatedAt'] as const;
  if (!required.every((key) => typeof value[key] === 'string')) return null;
  return {
    key: value.key as string,
    examCode: (value.examCode as string).toUpperCase(),
    datasetId: value.datasetId as string,
    datasetSlug: value.datasetSlug as string,
    questionId: value.questionId as string,
    prompt: (value.prompt as string).slice(0, 2400),
    ...(typeof value.note === 'string' && value.note.trim() ? { note: value.note.trim().slice(0, 500) } : {}),
    createdAt: value.createdAt as string,
    updatedAt: value.updatedAt as string
  };
}

function normalizeActivity(value: unknown): StudyActivityDay | null {
  if (!isRecord(value) || typeof value.date !== 'string') return null;
  return {
    date: value.date,
    questionsAnswered: safeCount(value.questionsAnswered),
    correctAnswers: safeCount(value.correctAnswers),
    examsSubmitted: safeCount(value.examsSubmitted),
    reviewedGuides: Array.isArray(value.reviewedGuides) ? value.reviewedGuides.filter((item): item is string => typeof item === 'string').slice(0, 100) : [],
    xp: safeCount(value.xp),
    goalAwarded: Boolean(value.goalAwarded)
  };
}

function normalizeDrill(value: unknown): StudyDrillConfig | null {
  if (!isRecord(value) || typeof value.examCode !== 'string' || typeof value.filter !== 'string' || typeof value.seed !== 'string' || typeof value.createdAt !== 'string') return null;
  if (!['weakest', 'missed', 'bookmarked', 'unseen', 'all'].includes(value.filter)) return null;
  const questionKeys = Array.isArray(value.questionKeys) ? value.questionKeys.filter((item): item is string => typeof item === 'string').slice(0, 50) : [];
  if (!questionKeys.length) return null;
  return {
    examCode: value.examCode.toUpperCase(),
    filter: value.filter as StudyDrillConfig['filter'],
    count: Math.max(1, Math.min(50, safeCount(value.count) || questionKeys.length)),
    questionKeys,
    seed: value.seed,
    createdAt: value.createdAt,
    ...(typeof value.objectiveId === 'string' ? { objectiveId: value.objectiveId } : {}),
    ...(typeof value.domainId === 'string' ? { domainId: value.domainId } : {}),
    ...(value.difficulty === 'easy' || value.difficulty === 'medium' || value.difficulty === 'hard' ? { difficulty: value.difficulty } : {})
  };
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function parseLocalDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dayDifference(left: Date, right: Date): number {
  return Math.round((Date.UTC(right.getFullYear(), right.getMonth(), right.getDate()) - Date.UTC(left.getFullYear(), left.getMonth(), left.getDate())) / 86_400_000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
