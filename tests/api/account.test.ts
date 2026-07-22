import { afterEach, describe, expect, it, vi } from 'vitest';
import { issueCsrfToken } from '../../api/_auth';
import { isReservedHandle, validateAdminAccountAction, validateAdminAccountUpdate, validateOnboarding, validateDomainPayload } from '../../api/_account';

describe('account API security contracts', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('requires the full age, policy, handle, and controlled-avatar onboarding contract', () => {
    expect(validateOnboarding({
      handle: 'new_player',
      avatar: 'quiz-bot',
      isAtLeast16: true,
      acceptsTerms: true,
      acknowledgesPrivacy: true
    })).toMatchObject({ ok: true, value: { handle: 'new_player' } });
    expect(validateOnboarding({ handle: 'new_player', avatar: 'quiz-bot' })).toMatchObject({ ok: false });
    expect(validateOnboarding({ handle: 'admin', avatar: 'quiz-bot', isAtLeast16: true, acceptsTerms: true, acknowledgesPrivacy: true })).toMatchObject({ ok: false });
    expect(isReservedHandle('support')).toBe(true);
  });

  it('rejects oversized, unsafe, and over-limit progress domains', () => {
    expect(validateDomainPayload('quiz', { attempts: Array.from({ length: 81 }, (_, id) => ({ id })) })).toBeNull();
    expect(validateDomainPayload('unknown', {})).toBeNull();
    expect(validateDomainPayload('preferences', { theme: 'light' })).toEqual({ domain: 'preferences', data: { theme: 'light' } });
  });

  it('allows only narrow, reasoned administrator account moderation', () => {
    expect(validateAdminAccountUpdate({ uid: 'user_123', reason: 'Offensive public handle', handle: 'safe_name', attributionEnabled: false })).toEqual({
      uid: 'user_123', reason: 'Offensive public handle', handle: 'safe_name', attributionEnabled: false
    });
    expect(validateAdminAccountUpdate({ uid: 'user_123', reason: 'Nope', handle: 'safe_name' })).toBeNull();
    expect(validateAdminAccountUpdate({ uid: 'user_123', reason: 'Do not enable this privately', attributionEnabled: true })).toBeNull();
    expect(validateAdminAccountUpdate({ uid: 'user_123', reason: 'Reserved impersonation', handle: 'admin' })).toBeNull();
    expect(validateAdminAccountAction({ uid: 'user_123', reason: 'Repeated abuse reports', action: 'suspend' })).toEqual({ uid: 'user_123', reason: 'Repeated abuse reports', action: 'suspend' });
    expect(validateAdminAccountAction({ uid: 'user_123', reason: 'Repeated abuse reports', action: 'delete' })).toBeNull();
  });

  it('issues a signed, HttpOnly, strict same-site CSRF cookie', () => {
    vi.stubEnv('CSRF_SECRET', 'a-secure-test-secret-that-is-longer-than-32-characters');
    const headers = new Map<string, unknown>();
    const response = { setHeader: (name: string, value: unknown) => headers.set(name, value) };
    const token = issueCsrfToken(response as never);
    const cookie = String(headers.get('Set-Cookie'));

    expect(token.length).toBeGreaterThan(30);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).not.toContain(token + ';');
  });
});
