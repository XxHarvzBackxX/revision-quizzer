// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import packageLock from '../package-lock.json';
import packageMetadata from '../package.json';
import {
  APP_VERSION,
  CHANGELOG_STORAGE_KEY,
  changelogEntries,
  currentChangelog,
  getLatestUnreadChangelog,
  markChangelogRead
} from './changelog';

describe('versioned changelog state', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the package version aligned with the newest release', () => {
    expect(APP_VERSION).toBe(packageMetadata.version);
    expect(packageLock.version).toBe(APP_VERSION);
    expect(packageLock.packages['']?.version).toBe(APP_VERSION);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(changelogEntries[0]).toBe(currentChangelog);
    expect(currentChangelog).toMatchObject({ version: '0.5.0', deployment: 9, title: 'Private accounts and secure progress sync' });
    expect(changelogEntries.map((entry) => entry.deployment)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(changelogEntries.filter((entry) => !entry.version).map((entry) => entry.deployment)).toEqual([4, 3, 2, 1]);
  });

  it('keeps changelog sections focused on user-facing outcomes', () => {
    const sections = changelogEntries.flatMap((entry) => entry.sections);
    expect(sections.some((section) => section.title.toLowerCase() === 'versioning')).toBe(false);
    expect(sections.flatMap((section) => section.items).some((item) => /Advanced Quiz Arcade to v\d/i.test(item))).toBe(false);
  });

  it('shows the newest unread release once and persists its dismissal', () => {
    expect(getLatestUnreadChangelog()?.version).toBe(APP_VERSION);

    markChangelogRead(APP_VERSION);

    expect(getLatestUnreadChangelog()).toBeUndefined();
    expect(JSON.parse(localStorage.getItem(CHANGELOG_STORAGE_KEY) ?? '{}')).toEqual({
      version: 1,
      readVersions: [APP_VERSION]
    });
  });

  it('does not auto-open an older release after the latest one is read', () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, JSON.stringify({ version: 1, readVersions: [APP_VERSION] }));

    expect(getLatestUnreadChangelog()).toBeUndefined();
    expect(changelogEntries.some((entry) => entry.deployment === 1 && !entry.version)).toBe(true);
  });

  it('recovers safely from malformed or unknown stored versions', () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, '{bad json');
    expect(getLatestUnreadChangelog()?.version).toBe(APP_VERSION);

    localStorage.setItem(CHANGELOG_STORAGE_KEY, JSON.stringify({ version: 1, readVersions: ['9.9.9'] }));
    markChangelogRead(APP_VERSION);
    expect(JSON.parse(localStorage.getItem(CHANGELOG_STORAGE_KEY) ?? '{}').readVersions).toEqual([APP_VERSION]);
  });
});
