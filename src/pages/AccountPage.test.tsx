// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountProfile } from '../../shared/account';
import { AccountPage } from './AccountPage';

const accountState = vi.hoisted(() => ({
  account: null as AccountProfile | null,
  refreshProfile: vi.fn(),
  reloadData: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('../account/AccountContext', () => ({ useAccount: () => accountState }));

vi.mock('../api', () => ({
  claimLegacyProgress: vi.fn(),
  deleteAccount: vi.fn(),
  deleteOwnedSubmission: vi.fn(),
  fetchOwnedSubmissions: vi.fn().mockResolvedValue([]),
  updateAccountProfile: vi.fn()
}));

vi.mock('../persistence', () => ({
  clearLegacyProgress: vi.fn(),
  collectLegacyProgress: vi.fn().mockReturnValue(null),
  purgeAccountCache: vi.fn()
}));

const profile: AccountProfile = {
  uid: 'admin-user-123',
  email: 'admin@example.com',
  handle: 'arcade_admin',
  avatar: 'astro-owl',
  attributionEnabled: false,
  admin: true,
  createdAt: '2026-07-22T00:00:00.000Z'
};

describe('AccountPage', () => {
  beforeEach(() => { accountState.account = profile; });
  afterEach(cleanup);

  it('offers administrator accounts a shortcut to the admin console', async () => {
    const navigate = vi.fn();
    render(<AccountPage navigate={navigate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Admin console' }));
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('does not show the admin shortcut to ordinary accounts', () => {
    accountState.account = { ...profile, admin: false };
    render(<AccountPage navigate={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Admin console' })).not.toBeInTheDocument();
  });
});
