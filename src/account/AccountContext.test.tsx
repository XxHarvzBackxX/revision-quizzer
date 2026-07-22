// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountProfile } from '../../shared/account';
import { resetPersistenceForTests } from '../persistence';
import { setTheme } from '../theme';
import { AccountProvider, useAccount } from './AccountContext';

const api = vi.hoisted(() => ({
  fetchAccount: vi.fn(),
  fetchAccountData: vi.fn(),
  signOutSession: vi.fn(),
  syncAccountDomain: vi.fn()
}));

vi.mock('../api', () => api);
vi.mock('../firebase', () => ({
  getFirebaseAuthClient: vi.fn(),
  isFirebaseConfigured: () => false
}));

const profile: AccountProfile = {
  uid: 'theme-user-123',
  email: 'theme@example.com',
  handle: 'theme_player',
  avatar: 'quiz-bot',
  attributionEnabled: false,
  admin: false,
  createdAt: '2026-07-22T00:00:00.000Z'
};

function SignOutHarness() {
  const { signOut } = useAccount();
  return <button onClick={() => { setTheme('neon-pink'); void signOut(); }}>Choose theme and sign out</button>;
}

describe('AccountProvider persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetPersistenceForTests();
    vi.clearAllMocks();
    api.fetchAccount.mockResolvedValue(profile);
    api.fetchAccountData.mockResolvedValue({});
    api.syncAccountDomain.mockResolvedValue(1);
    api.signOutSession.mockResolvedValue(undefined);
  });
  afterEach(() => { cleanup(); resetPersistenceForTests(); });

  it('flushes a pending theme preference before clearing the signed-in account', async () => {
    render(<AccountProvider><SignOutHarness /></AccountProvider>);
    await userEvent.click(await screen.findByRole('button', { name: 'Choose theme and sign out' }));

    await waitFor(() => expect(api.signOutSession).toHaveBeenCalled());
    expect(api.syncAccountDomain).toHaveBeenCalledWith('preferences', { 'quiz-arcade:theme:v1': 'neon-pink' }, 0);
    expect(api.syncAccountDomain.mock.invocationCallOrder[0]).toBeLessThan(api.signOutSession.mock.invocationCallOrder[0]);
  });
});
