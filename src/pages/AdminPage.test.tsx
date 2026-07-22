// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  fetchAdminConfig: vi.fn().mockResolvedValue({ moderationEnabled: false, themesRequireUnlock: true }),
  fetchAdminDatasets: vi.fn().mockResolvedValue([]),
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
});
