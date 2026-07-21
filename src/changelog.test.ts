// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
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
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(changelogEntries[0]).toBe(currentChangelog);
    expect(currentChangelog?.version).toBe('0.2.0');
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
    expect(changelogEntries.some((entry) => entry.version === '0.1.0')).toBe(true);
  });

  it('recovers safely from malformed or unknown stored versions', () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, '{bad json');
    expect(getLatestUnreadChangelog()?.version).toBe(APP_VERSION);

    localStorage.setItem(CHANGELOG_STORAGE_KEY, JSON.stringify({ version: 1, readVersions: ['9.9.9'] }));
    markChangelogRead(APP_VERSION);
    expect(JSON.parse(localStorage.getItem(CHANGELOG_STORAGE_KEY) ?? '{}').readVersions).toEqual([APP_VERSION]);
  });
});
