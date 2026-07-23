// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  collectLegacyProgress,
  configureAccountPersistence,
  configureGuestPersistence,
  getAccountDomainSnapshot,
  readAppStorage,
  resetPersistenceForTests,
  writeAppStorage
} from './persistence';

describe('account persistence boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetPersistenceForTests();
  });

  it('keeps guest learning progress in memory instead of browser storage', () => {
    configureGuestPersistence();
    writeAppStorage('quiz-arcade:attempts:v2', '[{"id":"guest"}]');

    expect(readAppStorage('quiz-arcade:attempts:v2')).toContain('guest');
    expect(localStorage.getItem('quiz-arcade:attempts:v2')).toBeNull();
  });

  it('isolates signed-in caches by Firebase UID and exports a domain snapshot', () => {
    configureAccountPersistence('user-one');
    writeAppStorage('quiz-arcade:attempts:v2', '[{"id":"one"}]');
    configureAccountPersistence('user-two');

    expect(readAppStorage('quiz-arcade:attempts:v2')).toBeNull();
    configureAccountPersistence('user-one');
    expect(getAccountDomainSnapshot('quiz')).toEqual({ 'quiz-arcade:attempts:v2': [{ id: 'one' }] });
  });

  it('syncs mistake review independently from quiz and study payloads', () => {
    configureAccountPersistence('reviewer');
    writeAppStorage('quiz-arcade:review:v1', JSON.stringify({ version: 1, records: { q1: { key: 'q1' } } }));
    expect(getAccountDomainSnapshot('review')).toEqual({ 'quiz-arcade:review:v1': { version: 1, records: { q1: { key: 'q1' } } } });
    expect(getAccountDomainSnapshot('study')).toEqual({});
  });

  it('detects frozen pre-account browser data without activating it', () => {
    localStorage.setItem('quiz-arcade:revision:v1', JSON.stringify({ version: 1, highlights: [] }));
    configureGuestPersistence();

    expect(readAppStorage('quiz-arcade:revision:v1')).toBeNull();
    expect(collectLegacyProgress()?.revision['quiz-arcade:revision:v1']).toEqual({ version: 1, highlights: [] });
  });
});
