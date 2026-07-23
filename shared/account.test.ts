import { describe, expect, it } from 'vitest';
import { ACCOUNT_AVATARS, ACCOUNT_DOMAINS, isAccountAvatar, normalizeHandle } from './account';

describe('account contracts', () => {
  it('normalizes only safe case-insensitive handles', () => {
    expect(normalizeHandle('  Harvey_07 ')).toBe('harvey_07');
    expect(normalizeHandle('ab')).toBeNull();
    expect(normalizeHandle('not allowed')).toBeNull();
    expect(normalizeHandle('a'.repeat(25))).toBeNull();
  });

  it('accepts only controlled preset avatars', () => {
    expect(ACCOUNT_AVATARS.every(isAccountAvatar)).toBe(true);
    expect(isAccountAvatar('https://example.com/photo.png')).toBe(false);
  });

  it('syncs mistake review as a dedicated account domain', () => {
    expect(ACCOUNT_DOMAINS).toContain('review');
  });
});
