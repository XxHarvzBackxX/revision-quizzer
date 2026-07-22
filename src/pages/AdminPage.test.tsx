// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateAdminAccount } from '../api';
import { AdminPage } from './AdminPage';

vi.mock('../account/AccountContext', () => ({
  useAccount: () => ({
    account: {
      uid: 'admin-user-123', email: 'admin@example.com', handle: 'arcade_admin', avatar: 'astro-owl',
      attributionEnabled: false, admin: true, createdAt: '2026-07-22T00:00:00.000Z'
    }
  })
}));

vi.mock('../api', () => ({
  applyAdminAccountAction: vi.fn(),
  fetchAdminAccounts: vi.fn().mockResolvedValue({
    accounts: [{
      uid: 'player-user-456', email: 'player@example.com', handle: 'rude_name', avatar: 'pixel-cat',
      attributionEnabled: true, admin: false, createdAt: '2026-07-20T00:00:00.000Z', status: 'active',
      disabled: false, emailVerified: true, providers: ['password'], lastActiveAt: '2026-07-22T00:00:00.000Z'
    }],
    nextCursor: null
  }),
  fetchAdminConfig: vi.fn().mockResolvedValue({ moderationEnabled: false, themesRequireUnlock: true }),
  fetchAdminDatasets: vi.fn().mockResolvedValue([]),
  updateAdminAccount: vi.fn().mockImplementation(async (update) => ({
    uid: update.uid, email: 'player@example.com', handle: update.handle ?? 'rude_name', avatar: 'pixel-cat',
    attributionEnabled: true, admin: false, createdAt: '2026-07-20T00:00:00.000Z', status: 'active',
    disabled: false, emailVerified: true, providers: ['password']
  })),
  updateAdminConfig: vi.fn(),
  updateAdminDataset: vi.fn(),
  deleteAdminDataset: vi.fn()
}));

vi.mock('../components/UploadPanel', () => ({ UploadPanel: () => <div>Upload tools</div> }));

describe('AdminPage', () => {
  afterEach(cleanup);

  it('links the signed-in administrator identity to account profile settings', async () => {
    const navigate = vi.fn();
    render(<AdminPage navigate={navigate} onUploaded={vi.fn()} onConfigChanged={vi.fn()} onToast={vi.fn()} />);

    expect(screen.getByText('@arcade_admin')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open @arcade_admin account profile' }));
    expect(navigate).toHaveBeenCalledWith('/account');
  });

  it('lets administrators search and apply an audited profile correction', async () => {
    render(<AdminPage navigate={vi.fn()} onUploaded={vi.fn()} onConfigChanged={vi.fn()} onToast={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Accounts' }));

    expect(await screen.findAllByText('@rude_name')).toHaveLength(2);
    await userEvent.clear(screen.getByLabelText('Handle'));
    await userEvent.type(screen.getByLabelText('Handle'), 'safe_name');
    await userEvent.type(screen.getByLabelText(/Moderation reason/), 'Reported offensive handle');
    await userEvent.click(screen.getByRole('button', { name: 'Save profile correction' }));

    expect(updateAdminAccount).toHaveBeenCalledWith({
      uid: 'player-user-456',
      reason: 'Reported offensive handle',
      handle: 'safe_name'
    });
    expect(screen.getByText(/Email addresses, administrator claims, and learning records cannot be changed here/)).toBeInTheDocument();
  });
});
