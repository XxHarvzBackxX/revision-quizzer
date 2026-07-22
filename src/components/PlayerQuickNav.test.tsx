// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerQuickNav } from './PlayerQuickNav';

describe('player quick navigation', () => {
  afterEach(cleanup);

  it('opens Study and Profile from the top-right player menu', async () => {
    const navigate = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PlayerQuickNav route={{ name: 'home', path: '/' }} navigate={navigate} />);
    const disclosure = container.querySelector('details');

    await user.click(screen.getByLabelText('Open player shortcuts'));
    await user.click(screen.getByRole('button', { name: /Study & Academy/ }));

    expect(navigate).toHaveBeenLastCalledWith('/study');
    expect(disclosure).not.toHaveAttribute('open');

    await user.click(screen.getByLabelText('Open player shortcuts'));
    await user.click(screen.getByRole('button', { name: /Player profile/ }));

    expect(navigate).toHaveBeenLastCalledWith('/study/profile');
    expect(disclosure).not.toHaveAttribute('open');
  });

  it('identifies the current player destination', async () => {
    render(<PlayerQuickNav route={{ name: 'study-profile', path: '/study/profile' }} navigate={vi.fn()} />);

    await userEvent.click(screen.getByLabelText('Open player shortcuts'));

    expect(screen.getByRole('button', { name: /Player profile/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Study & Academy/ })).not.toHaveAttribute('aria-current');
  });
});
