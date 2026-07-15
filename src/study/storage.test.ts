// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getStudyState, localDateKey, recordGuideReviewed, recordQuestionActivity, saveBookmarkNote,
  studyStreak, studyTotals, toggleStudyBookmark, updateStudySettings
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
});
