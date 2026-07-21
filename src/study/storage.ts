import { useEffect, useState } from 'react';
import type { QuizItem, PublicDataset } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import { buildAcademyQuests, buildRerollQuest, localWeekKey, type AcademyQuestContext } from './academy';
import type {
  AcademyAchievement,
  AcademyChallengeProgress,
  AcademyInventory,
  AcademyQuest,
  StudyAcademyState,
  StudyActivityDay,
  StudyActivityEvent,
  StudyBookmark,
  StudyDrillConfig,
  StudySettings,
  StudyState,
  StudyStateV1
} from './types';

export const STUDY_STORAGE_KEY = 'quiz-arcade:study:v2';
export const LEGACY_STUDY_STORAGE_KEY = 'quiz-arcade:study:v1';
const STUDY_EVENT = 'quiz-arcade:study-changed';
const DEFAULT_SETTINGS: StudySettings = { dailyQuestionGoal: 10, showExamConfidence: false };
const DEFAULT_INVENTORY: AcademyInventory = {
  rerolls: 0,
  streakShields: 0,
  unlockedCosmetics: ['title-new-challenger', 'token-brain'],
  equippedTitle: 'title-new-challenger',
  equippedToken: 'token-brain'
};

export function emptyStudyState(): StudyState {
  return {
    version: 2,
    settings: DEFAULT_SETTINGS,
    bookmarks: {},
    activity: {},
    activeDrills: {},
    academy: emptyAcademyState()
  };
}

export function getStudyState(): StudyState {
  try {
    const current = localStorage.getItem(STUDY_STORAGE_KEY);
    if (current) return normalizeStudyState(JSON.parse(current)) ?? emptyStudyState();
    const legacy = localStorage.getItem(LEGACY_STUDY_STORAGE_KEY);
    const migrated = legacy ? normalizeStudyState(JSON.parse(legacy)) : null;
    if (migrated) persistStudyState(migrated);
    return migrated ?? emptyStudyState();
  } catch {
    return emptyStudyState();
  }
}

export function saveStudyState(state: StudyState): StudyState {
  const normalized = normalizeStudyState(state) ?? emptyStudyState();
  persistStudyState(normalized);
  return normalized;
}

export function resetStudyContentProgress(datasetIds: ReadonlySet<string>, examCodes: ReadonlySet<string>): StudyState {
  const state = getStudyState();
  const bookmarks = Object.fromEntries(Object.entries(state.bookmarks).filter(([, bookmark]) => !datasetIds.has(bookmark.datasetId)));
  const activeDrills = Object.fromEntries(Object.entries(state.activeDrills).filter(([examCode]) => !examCodes.has(examCode.toUpperCase())));
  const challenges = Object.fromEntries(Object.entries(state.academy.challenges).filter(([, challenge]) => !examCodes.has(challenge.examCode.toUpperCase())));
  return saveStudyState({ ...state, bookmarks, activeDrills, academy: { ...state.academy, challenges } });
}

export function updateStudySettings(settings: Partial<StudySettings>): StudyState {
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

export function toggleStudyBookmark(input: Omit<StudyBookmark, 'createdAt' | 'updatedAt'>): StudyState {
  const state = getStudyState();
  const bookmarks = { ...state.bookmarks };
  const existing = bookmarks[input.key];
  if (existing) delete bookmarks[input.key];
  else {
    const now = new Date().toISOString();
    bookmarks[input.key] = { ...input, examCode: input.examCode.toUpperCase(), createdAt: now, updatedAt: now };
  }
  return saveStudyState({ ...state, bookmarks });
}

export function saveBookmarkNote(input: Omit<StudyBookmark, 'createdAt' | 'updatedAt' | 'note'>, note: string): StudyState {
  const state = getStudyState();
  const now = new Date().toISOString();
  const existing = state.bookmarks[input.key];
  const clean = note.trim().slice(0, 500);
  return saveStudyState({
    ...state,
    bookmarks: {
      ...state.bookmarks,
      [input.key]: { ...input, examCode: input.examCode.toUpperCase(), createdAt: existing?.createdAt ?? now, updatedAt: now, ...(clean ? { note: clean } : {}) }
    }
  });
}

export function beginStudyDrill(config: StudyDrillConfig): StudyState {
  const state = getStudyState();
  return saveStudyState({ ...state, activeDrills: { ...state.activeDrills, [config.examCode.toUpperCase()]: config } });
}

export function getActiveStudyDrill(examCode: string): StudyDrillConfig | undefined {
  return getStudyState().activeDrills[examCode.toUpperCase()];
}

export function recordQuestionActivity(
  input: boolean | { correct: boolean; examCode?: string; objectiveId?: string; bookmarked?: boolean; date?: Date },
  legacyDate = new Date()
): StudyState {
  const value = typeof input === 'boolean' ? { correct: input, date: legacyDate } : input;
  const date = value.date ?? legacyDate;
  return recordActivity(
    { questions: 1, correct: value.correct ? 1 : 0 },
    date,
    { kind: 'question', correct: value.correct, examCode: value.examCode?.toUpperCase(), objectiveId: value.objectiveId, bookmarked: value.bookmarked }
  );
}

export function recordExamActivity(
  answers: Array<{ correct: boolean; response?: string[]; objectiveId?: string }>,
  options: Date | { date?: Date; examCode?: string } = new Date()
): StudyState {
  const date = options instanceof Date ? options : options.date ?? new Date();
  const examCode = options instanceof Date ? undefined : options.examCode?.toUpperCase();
  const answered = answers.filter((answer) => !answer.response || answer.response.some(Boolean));
  const events: StudyActivityEvent[] = answered.map((answer) => ({
    kind: 'question', examCode, objectiveId: answer.objectiveId, correct: answer.correct
  }));
  return recordActivity(
    { questions: answered.length, correct: answered.filter((answer) => answer.correct).length, exams: 1 },
    date,
    events
  );
}

export function recordGuideReviewed(examCode: string, pageId: string, date = new Date()): StudyState {
  return recordActivity(
    { guide: `${examCode.toUpperCase()}/${pageId}` },
    date,
    { kind: 'guide', examCode: examCode.toUpperCase() }
  );
}

export function recordDrillCompleted(examCode: string, date = new Date()): StudyState {
  return recordActivity({}, date, { kind: 'drill', examCode: examCode.toUpperCase() });
}

export function ensureAcademyQuests(context: AcademyQuestContext): StudyState {
  const state = getStudyState();
  const generated = buildAcademyQuests(context);
  const quests = { ...state.academy.quests };
  let changed = false;
  for (const quest of generated) {
    if (!quests[quest.id]) {
      quests[quest.id] = quest;
      changed = true;
    }
  }
  if (!changed) return state;
  return saveStudyState({ ...state, academy: { ...state.academy, quests: trimQuests(quests) } });
}

export function getActiveAcademyQuests(state: StudyState, examCode: string, now = new Date()): AcademyQuest[] {
  const code = examCode.toUpperCase();
  const dayKey = localDateKey(now);
  const weekKey = localWeekKey(now);
  return Object.values(state.academy.quests)
    .filter((quest) => quest.examCode === code && !quest.replacedBy && (
      (quest.period === 'daily' && quest.periodKey === dayKey)
      || (quest.period === 'weekly' && quest.periodKey === weekKey)
    ))
    .sort((left, right) => left.period.localeCompare(right.period) || left.slot - right.slot);
}

export function claimAcademyQuest(questId: string, date = new Date()): StudyState {
  const state = getStudyState();
  const quest = state.academy.quests[questId];
  if (!quest?.completedAt || quest.claimedAt) return state;
  const claimedAt = date.toISOString();
  const quests = { ...state.academy.quests, [questId]: { ...quest, claimedAt } };
  let next = addXp({ ...state, academy: { ...state.academy, quests } }, quest.rewardXp, date);
  const activePeriod = Object.values(quests).filter((item) => (
    item.examCode === quest.examCode
    && item.period === quest.period
    && item.periodKey === quest.periodKey
    && !item.replacedBy
  ));
  const bonusKey = `${quest.period}:${quest.examCode}:${quest.periodKey}`;
  if (activePeriod.length === 3 && activePeriod.every((item) => item.claimedAt) && !next.academy.claimedPeriodBonuses.includes(bonusKey)) {
    const inventory = { ...next.academy.inventory };
    if (quest.period === 'daily') inventory.rerolls = Math.min(3, inventory.rerolls + 1);
    else inventory.streakShields = Math.min(2, inventory.streakShields + 1);
    next = {
      ...next,
      academy: {
        ...next.academy,
        inventory,
        claimedPeriodBonuses: [...next.academy.claimedPeriodBonuses, bonusKey].slice(-200)
      }
    };
  }
  return saveStudyState(next);
}

export function rerollAcademyQuest(questId: string, context: AcademyQuestContext): StudyState {
  const state = getStudyState();
  if (state.academy.inventory.rerolls < 1) return state;
  const current = state.academy.quests[questId];
  if (!current) return state;
  const active = getActiveAcademyQuests(state, current.examCode, context.now);
  const replacement = buildRerollQuest(current, active, context);
  if (!replacement) return state;
  return saveStudyState({
    ...state,
    academy: {
      ...state.academy,
      quests: {
        ...state.academy.quests,
        [current.id]: { ...current, replacedBy: replacement.id },
        [replacement.id]: replacement
      },
      inventory: { ...state.academy.inventory, rerolls: state.academy.inventory.rerolls - 1 }
    }
  });
}

export function recordAcademyChallenge(
  attempt: Pick<AttemptRecord, 'id' | 'percentage'>,
  config: StudyDrillConfig,
  date = new Date()
): StudyState {
  if (!config.challengeId || (config.mode !== 'domain-boss' && config.mode !== 'final-boss')) return getStudyState();
  let state = getStudyState();
  const existing = state.academy.challenges[config.challengeId];
  if (existing?.attemptIds.includes(attempt.id)) return state;
  const passed = attempt.percentage >= 80;
  const firstPass = passed && !existing?.passedAt;
  const challenge: AcademyChallengeProgress = {
    challengeId: config.challengeId,
    examCode: config.examCode.toUpperCase(),
    kind: config.mode,
    ...(config.domainId ? { domainId: config.domainId } : {}),
    bestPercentage: Math.max(existing?.bestPercentage ?? 0, attempt.percentage),
    attempts: (existing?.attempts ?? 0) + 1,
    attemptIds: [...(existing?.attemptIds ?? []), attempt.id].slice(-30),
    ...(existing?.passedAt || passed ? { passedAt: existing?.passedAt ?? date.toISOString() } : {}),
    ...(existing?.rewardedAt || firstPass ? { rewardedAt: existing?.rewardedAt ?? date.toISOString() } : {})
  };
  state = {
    ...state,
    academy: { ...state.academy, challenges: { ...state.academy.challenges, [config.challengeId]: challenge } }
  };
  if (firstPass) state = addXp(state, config.mode === 'final-boss' ? 500 : 250, date);
  state = progressAcademyQuests(state, { kind: 'drill', examCode: config.examCode.toUpperCase() }, date);
  return saveStudyState(state);
}

export function syncAcademyAchievements({
  totalStars,
  passedDomainBosses,
  passedFinalBosses,
  date = new Date()
}: {
  totalStars: number;
  passedDomainBosses: number;
  passedFinalBosses: number;
  date?: Date;
}): StudyState {
  const state = getStudyState();
  const definitions = [
    { id: 'first-star', unlocked: totalStars >= 1, cosmetics: ['title-objective-hunter'] },
    { id: 'ten-stars', unlocked: totalStars >= 10, cosmetics: ['token-bolt'] },
    { id: 'domain-champion', unlocked: passedDomainBosses >= 1, cosmetics: ['title-domain-champion'] },
    { id: 'certification-conqueror', unlocked: passedFinalBosses >= 1, cosmetics: ['title-certification-conqueror', 'token-crown'] }
  ];
  const achievements = { ...state.academy.achievements };
  const cosmetics = new Set(state.academy.inventory.unlockedCosmetics);
  let changed = false;
  for (const definition of definitions) {
    if (!definition.unlocked || achievements[definition.id]) continue;
    achievements[definition.id] = { id: definition.id, unlockedAt: date.toISOString() };
    definition.cosmetics.forEach((item) => cosmetics.add(item));
    changed = true;
  }
  if (!changed) return state;
  return saveStudyState({
    ...state,
    academy: {
      ...state.academy,
      achievements,
      inventory: { ...state.academy.inventory, unlockedCosmetics: [...cosmetics] }
    }
  });
}

export function equipAcademyCosmetic(kind: 'title' | 'token', id: string): StudyState {
  const state = getStudyState();
  if (!state.academy.inventory.unlockedCosmetics.includes(id) || !id.startsWith(`${kind}-`)) return state;
  const inventory = {
    ...state.academy.inventory,
    ...(kind === 'title' ? { equippedTitle: id } : { equippedToken: id })
  };
  return saveStudyState({ ...state, academy: { ...state.academy, inventory } });
}

export function shieldRecoveryDate(state = getStudyState(), today = new Date()): string | undefined {
  if (state.academy.inventory.streakShields < 1) return undefined;
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const dayBefore = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
  const yesterdayKey = localDateKey(yesterday);
  const dayBeforeKey = localDateKey(dayBefore);
  const completed = completedStudyDates(state);
  return !completed.has(yesterdayKey) && completed.has(dayBeforeKey) ? yesterdayKey : undefined;
}

export function useStreakShield(today = new Date()): StudyState {
  const state = getStudyState();
  const date = shieldRecoveryDate(state, today);
  if (!date) return state;
  return saveStudyState({
    ...state,
    academy: {
      ...state.academy,
      inventory: { ...state.academy.inventory, streakShields: state.academy.inventory.streakShields - 1 },
      protectedDates: [...new Set([...state.academy.protectedDates, date])].slice(-100)
    }
  });
}

export function studyTotals(state = getStudyState()): { xp: number; level: number; levelProgress: number } {
  const xp = Object.values(state.activity).reduce((sum, day) => sum + day.xp, 0);
  return { xp, level: Math.floor(xp / 500) + 1, levelProgress: xp % 500 };
}

export function studyStreak(state = getStudyState(), today = new Date()): { current: number; longest: number; completedToday: boolean } {
  const completed = completedStudyDates(state);
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
  return { current, longest, completedToday: Boolean(state.activity[todayKey]?.goalAwarded) };
}

export function useStudyState(): StudyState {
  const [state, setState] = useState<StudyState>(() => getStudyState());
  useEffect(() => {
    const update = () => setState(getStudyState());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STUDY_STORAGE_KEY || event.key === LEGACY_STUDY_STORAGE_KEY) update();
    };
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

function recordActivity(
  input: { questions?: number; correct?: number; exams?: number; guide?: string },
  date: Date,
  events?: StudyActivityEvent | StudyActivityEvent[]
): StudyState {
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
  let next: StudyState = { ...state, activity: { ...state.activity, [key]: day } };
  for (const event of Array.isArray(events) ? events : events ? [events] : []) {
    next = progressAcademyQuests(next, event, date);
  }
  return saveStudyState(next);
}

function progressAcademyQuests(state: StudyState, event: StudyActivityEvent, date: Date): StudyState {
  if (!event.examCode) return state;
  const examCode = event.examCode.toUpperCase();
  const dayKey = localDateKey(date);
  const weekKey = localWeekKey(date);
  let changed = false;
  const quests = Object.fromEntries(Object.entries(state.academy.quests).map(([id, quest]) => {
    const active = quest.examCode === examCode && !quest.completedAt && !quest.replacedBy && (
      (quest.period === 'daily' && quest.periodKey === dayKey)
      || (quest.period === 'weekly' && quest.periodKey === weekKey)
    );
    if (!active || !questMatchesEvent(quest, event)) return [id, quest];
    const progress = Math.min(quest.target, quest.progress + 1);
    changed = true;
    return [id, { ...quest, progress, ...(progress >= quest.target ? { completedAt: date.toISOString() } : {}) }];
  }));
  return changed ? { ...state, academy: { ...state.academy, quests } } : state;
}

function questMatchesEvent(quest: AcademyQuest, event: StudyActivityEvent): boolean {
  if (quest.kind === 'answer') return event.kind === 'question';
  if (quest.kind === 'correct') return event.kind === 'question' && Boolean(event.correct);
  if (quest.kind === 'objective') return event.kind === 'question' && event.objectiveId === quest.objectiveId;
  if (quest.kind === 'bookmarked') return event.kind === 'question' && Boolean(event.bookmarked);
  if (quest.kind === 'guide') return event.kind === 'guide';
  return event.kind === 'drill';
}

function addXp(state: StudyState, xp: number, date: Date): StudyState {
  const key = localDateKey(date);
  const existing = state.activity[key] ?? emptyActivity(key);
  return { ...state, activity: { ...state.activity, [key]: { ...existing, xp: existing.xp + xp } } };
}

function completedStudyDates(state: StudyState): Set<string> {
  return new Set([
    ...Object.values(state.activity).filter((day) => day.goalAwarded).map((day) => day.date),
    ...state.academy.protectedDates
  ]);
}

function emptyActivity(date: string): StudyActivityDay {
  return { date, questionsAnswered: 0, correctAnswers: 0, examsSubmitted: 0, reviewedGuides: [], xp: 0, goalAwarded: false };
}

function emptyAcademyState(): StudyAcademyState {
  return {
    quests: {},
    challenges: {},
    achievements: {},
    inventory: { ...DEFAULT_INVENTORY, unlockedCosmetics: [...DEFAULT_INVENTORY.unlockedCosmetics] },
    protectedDates: [],
    claimedPeriodBonuses: []
  };
}

function normalizeStudyState(value: unknown): StudyState | null {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) return null;
  const settingsRecord = isRecord(value.settings) ? value.settings : {};
  const dailyQuestionGoal = [5, 10, 20, 30].includes(Number(settingsRecord.dailyQuestionGoal))
    ? Number(settingsRecord.dailyQuestionGoal) as StudySettings['dailyQuestionGoal']
    : 10;
  const bookmarks = normalizeRecord(value.bookmarks, normalizeBookmark);
  const activity = normalizeRecord(value.activity, normalizeActivity);
  const activeDrills = normalizeRecord(value.activeDrills, normalizeDrill, (key) => key.toUpperCase());
  const legacy: Omit<StudyStateV1, 'version'> = {
    settings: { dailyQuestionGoal, showExamConfidence: Boolean(settingsRecord.showExamConfidence) },
    bookmarks,
    activity,
    activeDrills
  };
  return {
    version: 2,
    ...legacy,
    academy: value.version === 2 ? normalizeAcademy(value.academy) : emptyAcademyState()
  };
}

function normalizeAcademy(value: unknown): StudyAcademyState {
  if (!isRecord(value)) return emptyAcademyState();
  const quests = normalizeRecord(value.quests, normalizeQuest);
  const challenges = normalizeRecord(value.challenges, normalizeChallenge);
  const achievements = normalizeRecord(value.achievements, normalizeAchievement);
  const inventory = normalizeInventory(value.inventory);
  return {
    quests: trimQuests(quests),
    challenges,
    achievements,
    inventory,
    protectedDates: stringArray(value.protectedDates, 100),
    claimedPeriodBonuses: stringArray(value.claimedPeriodBonuses, 200)
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
    reviewedGuides: stringArray(value.reviewedGuides, 100),
    xp: safeCount(value.xp),
    goalAwarded: Boolean(value.goalAwarded)
  };
}

function normalizeDrill(value: unknown): StudyDrillConfig | null {
  if (!isRecord(value) || typeof value.examCode !== 'string' || typeof value.filter !== 'string' || typeof value.seed !== 'string' || typeof value.createdAt !== 'string') return null;
  if (!['weakest', 'missed', 'bookmarked', 'unseen', 'all'].includes(value.filter)) return null;
  const questionKeys = stringArray(value.questionKeys, 50);
  if (!questionKeys.length) return null;
  const mode = value.mode === 'domain-boss' || value.mode === 'final-boss' ? value.mode : 'practice';
  return {
    examCode: value.examCode.toUpperCase(),
    filter: value.filter as StudyDrillConfig['filter'],
    mode,
    count: Math.max(1, Math.min(50, safeCount(value.count) || questionKeys.length)),
    questionKeys,
    seed: value.seed,
    createdAt: value.createdAt,
    ...(typeof value.challengeId === 'string' ? { challengeId: value.challengeId } : {}),
    ...(typeof value.objectiveId === 'string' ? { objectiveId: value.objectiveId } : {}),
    ...(typeof value.domainId === 'string' ? { domainId: value.domainId } : {}),
    ...(value.difficulty === 'easy' || value.difficulty === 'medium' || value.difficulty === 'hard' ? { difficulty: value.difficulty } : {})
  };
}

function normalizeQuest(value: unknown): AcademyQuest | null {
  if (!isRecord(value)) return null;
  const period = value.period === 'daily' || value.period === 'weekly' ? value.period : null;
  const kinds = ['answer', 'correct', 'objective', 'bookmarked', 'guide', 'drill'];
  if (!period || !kinds.includes(String(value.kind))) return null;
  const required = ['id', 'examCode', 'periodKey', 'title', 'description'] as const;
  if (!required.every((key) => typeof value[key] === 'string')) return null;
  return {
    id: value.id as string,
    examCode: (value.examCode as string).toUpperCase(),
    period,
    periodKey: value.periodKey as string,
    slot: safeCount(value.slot),
    kind: value.kind as AcademyQuest['kind'],
    title: (value.title as string).slice(0, 100),
    description: (value.description as string).slice(0, 240),
    target: Math.max(1, safeCount(value.target)),
    progress: safeCount(value.progress),
    rewardXp: safeCount(value.rewardXp),
    ...(typeof value.objectiveId === 'string' ? { objectiveId: value.objectiveId } : {}),
    ...(typeof value.completedAt === 'string' ? { completedAt: value.completedAt } : {}),
    ...(typeof value.claimedAt === 'string' ? { claimedAt: value.claimedAt } : {}),
    ...(typeof value.replacedBy === 'string' ? { replacedBy: value.replacedBy } : {}),
    ...(typeof value.rerolledFrom === 'string' ? { rerolledFrom: value.rerolledFrom } : {})
  };
}

function normalizeChallenge(value: unknown): AcademyChallengeProgress | null {
  if (!isRecord(value) || typeof value.challengeId !== 'string' || typeof value.examCode !== 'string') return null;
  if (value.kind !== 'domain-boss' && value.kind !== 'final-boss') return null;
  return {
    challengeId: value.challengeId,
    examCode: value.examCode.toUpperCase(),
    kind: value.kind,
    ...(typeof value.domainId === 'string' ? { domainId: value.domainId } : {}),
    bestPercentage: Math.min(100, safeCount(value.bestPercentage)),
    attempts: safeCount(value.attempts),
    attemptIds: stringArray(value.attemptIds, 30),
    ...(typeof value.passedAt === 'string' ? { passedAt: value.passedAt } : {}),
    ...(typeof value.rewardedAt === 'string' ? { rewardedAt: value.rewardedAt } : {})
  };
}

function normalizeAchievement(value: unknown): AcademyAchievement | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.unlockedAt !== 'string') return null;
  return { id: value.id, unlockedAt: value.unlockedAt };
}

function normalizeInventory(value: unknown): AcademyInventory {
  if (!isRecord(value)) return { ...DEFAULT_INVENTORY, unlockedCosmetics: [...DEFAULT_INVENTORY.unlockedCosmetics] };
  const unlockedCosmetics = [...new Set([...DEFAULT_INVENTORY.unlockedCosmetics, ...stringArray(value.unlockedCosmetics, 50)])];
  const equippedTitle = typeof value.equippedTitle === 'string' && unlockedCosmetics.includes(value.equippedTitle) ? value.equippedTitle : DEFAULT_INVENTORY.equippedTitle;
  const equippedToken = typeof value.equippedToken === 'string' && unlockedCosmetics.includes(value.equippedToken) ? value.equippedToken : DEFAULT_INVENTORY.equippedToken;
  return {
    rerolls: Math.min(3, safeCount(value.rerolls)),
    streakShields: Math.min(2, safeCount(value.streakShields)),
    unlockedCosmetics,
    equippedTitle,
    equippedToken
  };
}

function trimQuests(quests: Record<string, AcademyQuest>): Record<string, AcademyQuest> {
  return Object.fromEntries(Object.values(quests).sort((left, right) => right.periodKey.localeCompare(left.periodKey)).slice(0, 300).map((quest) => [quest.id, quest]));
}

function normalizeRecord<T>(value: unknown, normalize: (entry: unknown) => T | null, keyMap: (key: string) => string = (key) => key): Record<string, T> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    const normalized = normalize(entry);
    return normalized ? [[keyMap(key), normalized]] : [];
  }));
}

function persistStudyState(state: StudyState): void {
  try {
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(STUDY_EVENT));
  } catch {
    // Study tools remain usable when storage is unavailable.
  }
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, limit) : [];
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
