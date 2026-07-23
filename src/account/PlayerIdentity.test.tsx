// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AccountProfile } from '../../shared/account';
import { PlayerIdentity } from './PlayerIdentity';

const account: AccountProfile = {
  uid: 'firebase-user-123',
  email: 'player@example.com',
  handle: 'cloud_player',
  avatar: 'cloud-fox',
  attributionEnabled: true,
  admin: false,
  createdAt: '2026-07-22T00:00:00.000Z'
};

describe('PlayerIdentity', () => {
  afterEach(cleanup);

  it('shows the account avatar and handle and opens its destination', async () => {
    const onOpen = vi.fn();
    render(<PlayerIdentity account={account} label="Level 4 · Cloud Champion" actionLabel="Player profile" onOpen={onOpen} />);

    expect(screen.getByRole('img', { name: 'cloud_player avatar' })).toBeInTheDocument();
    expect(screen.getByText('@cloud_player')).toBeInTheDocument();
    expect(screen.getByText('Level 4 · Cloud Champion')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open @cloud_player player profile' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('renders nothing for a guest', () => {
    const { container } = render(<PlayerIdentity account={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
