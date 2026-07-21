// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  claimAcademyQuest, emptyStudyState, ensureAcademyQuests, getActiveAcademyQuests, getStudyState,
  LEGACY_STUDY_STORAGE_KEY, localDateKey, recordAcademyChallenge, recordGuideReviewed, recordQuestionActivity,
  saveBookmarkNote, saveStudyState, shieldRecoveryDate, studyStreak, studyTotals, toggleStudyBookmark,
  resetStudyContentProgress, updateStudySettings, useStreakShield
} from './storage';

const bookmark = { key: 'paper/q1', examCode: 'AI-901', datasetId: 'paper', datasetSlug: 'paper', questionId: 'q1', prompt: 'Prompt' };

describe('smart study local storage', () => {
  beforeEach(() => localStorage.clear());

  it('awards the configured meaningful daily goal once', () => {
    updateStudySettings({ dailyQuestionGoal: 10 });
    const day = new Date(2026, 6, 15, 12);
    for (let index = 0; index < 10; index += 1) recordQuestionActivity(index < 5, day);
    expect(getStudyState().activity[localDateKey(day)]).toMatchObject({ questionsAnswered: 10, correctAnswers: 5, goalAwarded: true, xp: 125 });
    recordQuestionActivity(false, day);
    expect(getStudyState().activity[localDateKey(day)].xp).toBe(130);
  });

  it('maintains current and longest streaks over local dates', () => {
    recordGuideReviewed('AI-901', 'one', new Date(2026, 6, 13, 12));
    recordGuideReviewed('AI-901', 'two', new Date(2026, 6, 14, 12));
    recordGuideReviewed('AI-901', 'three', new Date(2026, 6, 15, 12));
    expect(studyStreak(getStudyState(), new Date(2026, 6, 15, 18))).toEqual({ current: 3, longest: 3, completedToday: true });
    expect(studyTotals().xp).toBe(240);
  });

  it('persists bookmarks and creates a bookmark when a note is saved', () => {
    toggleStudyBookmark(bookmark);
    expect(getStudyState().bookmarks[bookmark.key]).toBeTruthy();
    toggleStudyBookmark(bookmark);
    expect(getStudyState().bookmarks[bookmark.key]).toBeUndefined();
    saveBookmarkNote(bookmark, 'Remember the service boundary.');
    expect(getStudyState().bookmarks[bookmark.key].note).toBe('Remember the service boundary.');
  });

  it('migrates V1 progress into the V2 academy state', () => {
    localStorage.setItem(LEGACY_STUDY_STORAGE_KEY, JSON.stringify({
      version: 1,
      settings: { dailyQuestionGoal: 20, showExamConfidence: true },
      bookmarks: {},
      activity: {},
      activeDrills: {}
    }));

    expect(getStudyState()).toMatchObject({
      version: 2,
      settings: { dailyQuestionGoal: 20, showExamConfidence: true },
      academy: { inventory: { rerolls: 0, streakShields: 0 } }
    });
  });

  it('resets question-linked content while preserving activity, settings, and academy inventory', () => {
    const state = emptyStudyState();
    saveStudyState({
      ...state,
      settings: { dailyQuestionGoal: 20, showExamConfidence: true },
      bookmarks: {
        old: { ...bookmark, key: 'old', datasetId: 'builtin-ai901-paper-1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        keep: { ...bookmark, key: 'keep', examCode: 'OTHER', datasetId: 'community-paper', createdAt: '2026-01-01', updatedAt: '2026-01-01' }
      },
      activity: { '2026-07-20': { date: '2026-07-20', questionsAnswered: 4, correctAnswers: 3, examsSubmitted: 0, reviewedGuides: [], xp: 40, goalAwarded: false } },
      activeDrills: { 'AI-901': { examCode: 'AI-901', filter: 'all', count: 1, questionKeys: [], seed: 'old', createdAt: '2026-01-01' } },
      academy: { ...state.academy, inventory: { ...state.academy.inventory, rerolls: 2 } }
    });

    const reset = resetStudyContentProgress(new Set(['builtin-ai901-paper-1']), new Set(['AI-901']));

    expect(Object.keys(reset.bookmarks)).toEqual(['keep']);
    expect(reset.activeDrills['AI-901']).toBeUndefined();
    expect(reset.activity['2026-07-20'].xp).toBe(40);
    expect(reset.settings.dailyQuestionGoal).toBe(20);
    expect(reset.academy.inventory.rerolls).toBe(2);
  });

  it('tracks and claims quests once, then awards the daily sweep reroll', () => {
    const day = new Date(2026, 6, 22, 12);
    ensureAcademyQuests({ examCode: 'AI-901', now: day, unreviewedGuideCount: 1 });
    for (let index = 0; index < 5; index += 1) {
      recordQuestionActivity({ correct: index < 4, examCode: 'AI-901', objectiveId: 'responsible-ai', date: day });
    }
    recordGuideReviewed('AI-901', 'responsible-ai', day);
    const completed = getActiveAcademyQuests(getStudyState(), 'AI-901', day).filter((quest) => quest.period === 'daily');
    expect(completed.every((quest) => quest.completedAt)).toBe(true);

    completed.forEach((quest) => claimAcademyQuest(quest.id, day));
    const claimed = getStudyState();
    expect(claimed.academy.inventory.rerolls).toBe(1);
    const xp = studyTotals(claimed).xp;
    claimAcademyQuest(completed[0].id, day);
    expect(studyTotals().xp).toBe(xp);
  });

  it('uses a shield for exactly one recoverable missed day', () => {
    const dayBefore = new Date(2026, 6, 13, 12);
    const today = new Date(2026, 6, 15, 12);
    recordGuideReviewed('AI-901', 'one', dayBefore);
    const state = getStudyState();
    saveStudyState({
      ...state,
      academy: { ...state.academy, inventory: { ...state.academy.inventory, streakShields: 1 } }
    });

    expect(shieldRecoveryDate(getStudyState(), today)).toBe('2026-07-14');
    useStreakShield(today);
    expect(getStudyState().academy.inventory.streakShields).toBe(0);
    expect(studyStreak(getStudyState(), today).current).toBe(2);
  });

  it('records a boss reward idempotently', () => {
    saveStudyState(emptyStudyState());
    const config = {
      examCode: 'AI-901', filter: 'all' as const, mode: 'domain-boss' as const,
      challengeId: 'AI-901:domain:one', domainId: 'one', count: 1,
      questionKeys: ['paper/q1'], seed: 'boss', createdAt: '2026-07-22T12:00:00.000Z'
    };
    const day = new Date(2026, 6, 22, 12);

    recordAcademyChallenge({ id: 'attempt-1', percentage: 80 }, config, day);
    recordAcademyChallenge({ id: 'attempt-1', percentage: 80 }, config, day);

    expect(getStudyState().academy.challenges[config.challengeId]).toMatchObject({ attempts: 1, bestPercentage: 80 });
    expect(studyTotals().xp).toBe(250);
  });
});
