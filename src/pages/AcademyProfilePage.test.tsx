// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyStudyState, getStudyState, saveStudyState } from '../study/storage';
import { AcademyProfilePage } from './AcademyProfilePage';

describe('AcademyProfilePage', () => {
  beforeEach(() => {
    localStorage.clear();
    const state = emptyStudyState();
    saveStudyState({
      ...state,
      academy: {
        ...state.academy,
        inventory: {
          ...state.academy.inventory,
          unlockedCosmetics: [...state.academy.inventory.unlockedCosmetics, 'title-domain-champion']
        }
      }
    });
  });
  afterEach(cleanup);

  it('shows the trophy cabinet and equips unlocked cosmetics', async () => {
    const user = userEvent.setup();
    render(<AcademyProfilePage datasets={[]} attempts={[]} navigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'New Challenger' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Domain Champion/i }));

    expect(getStudyState().academy.inventory.equippedTitle).toBe('title-domain-champion');
  });

  it('shows theme rewards as locked or site-wide and equips an available palette', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AcademyProfilePage datasets={[]} attempts={[]} navigate={vi.fn()} themesRequireUnlock />);

    expect(screen.getByRole('heading', { name: 'Theme rewards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pacific blue.*Locked/i })).toBeDisabled();

    rerender(<AcademyProfilePage datasets={[]} attempts={[]} navigate={vi.fn()} themesRequireUnlock={false} />);
    await user.click(screen.getByRole('button', { name: /Pacific blue.*Available site-wide.*Available/i }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'pacific-blue');

    await user.click(screen.getByRole('checkbox', { name: 'Use dark mode for Pacific blue' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark-pacific-blue');
  });
});
