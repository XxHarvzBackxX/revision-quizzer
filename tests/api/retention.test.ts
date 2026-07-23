import { describe, expect, it } from 'vitest';
import { retentionAction } from '../../api/cron/retention';

const now = new Date('2026-07-22T12:00:00.000Z');

describe('account inactivity retention', () => {
  it('does nothing while the account is active', () => {
    expect(retentionAction(now, new Date('2025-01-01T00:00:00.000Z'))).toBe('none');
  });

  it('requires a warning before deletion even after two years', () => {
    expect(retentionAction(now, new Date('2024-07-01T00:00:00.000Z'))).toBe('warn');
  });

  it('waits at least 30 days after a successful warning', () => {
    const lastActive = new Date('2024-07-01T00:00:00.000Z');
    expect(retentionAction(now, lastActive, new Date('2026-07-01T00:00:00.000Z'))).toBe('none');
    expect(retentionAction(now, lastActive, new Date('2026-06-01T00:00:00.000Z'))).toBe('delete');
  });

  it('requires a fresh warning after the user returns', () => {
    expect(retentionAction(now, new Date('2024-07-01T00:00:00.000Z'), new Date('2024-06-01T00:00:00.000Z'))).toBe('warn');
  });
});
