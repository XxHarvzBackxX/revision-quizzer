import { describe, expect, it } from 'vitest';
import { normalizeAppConfig } from '../../api/_config';

describe('app configuration mapping', () => {
  it('requires Academy unlocks when the theme setting has not been saved yet', () => {
    expect(normalizeAppConfig({}, ' fallback-key ')).toEqual({
      moderationEnabled: false,
      uploadKey: 'fallback-key',
      themesRequireUnlock: true
    });
  });

  it('honours site-wide theme availability and stored upload settings', () => {
    expect(normalizeAppConfig({
      moderationEnabled: true,
      uploadKey: ' stored-key ',
      themesRequireUnlock: false
    }, 'fallback-key')).toEqual({
      moderationEnabled: true,
      uploadKey: 'stored-key',
      themesRequireUnlock: false
    });
  });
});
