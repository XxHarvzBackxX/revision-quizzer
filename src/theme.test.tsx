// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemePicker } from './components/ThemePicker';
import { applyTheme, getStoredTheme, isThemeAvailable, rewardThemeFamilies, setTheme, THEME_STORAGE_KEY, themeOptions } from './theme';

describe('site themes', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
  });
  afterEach(cleanup);

  it('falls back safely and exposes the core and bonus palettes', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'unknown');
    expect(getStoredTheme()).toBe('light');
    expect(themeOptions.map((theme) => theme.id)).toEqual([
      'light', 'light-contrast', 'dark', 'dark-contrast', 'dark-purple', 'mint',
      'pacific-blue', 'dark-pacific-blue', 'arcade-red', 'dark-arcade-red',
      'sunset-orange', 'dark-sunset-orange', 'solar-yellow', 'dark-solar-yellow',
      'neon-pink', 'dark-neon-pink'
    ]);
    expect(rewardThemeFamilies).toHaveLength(5);
  });

  it('uses Academy progress only when the administrator requires unlocks', () => {
    const blue = themeOptions.find((option) => option.id === 'pacific-blue')!;
    const red = themeOptions.find((option) => option.id === 'arcade-red')!;

    expect(isThemeAvailable(blue, true, { level: 1, achievementIds: [] })).toBe(false);
    expect(isThemeAvailable(blue, false, { level: 1, achievementIds: [] })).toBe(true);
    expect(isThemeAvailable(blue, true, { level: 1, achievementIds: ['first-star'] })).toBe(true);
    expect(isThemeAvailable(red, true, { level: 2, achievementIds: [] })).toBe(false);
    expect(isThemeAvailable(red, true, { level: 3, achievementIds: [] })).toBe(true);
  });

  it('applies and persists light and dark colour schemes', () => {
    setTheme('dark-purple');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('"dark-purple"');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark-purple');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    applyTheme('mint');
    expect(document.documentElement.style.colorScheme).toBe('light');
    applyTheme('dark-pacific-blue');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('changes theme through the accessible top-bar picker', async () => {
    render(<ThemePicker />);
    await userEvent.click(screen.getByText('Theme'));
    await userEvent.click(screen.getByRole('button', { name: /Dark contrast/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark-contrast');
    expect(screen.getByLabelText('Choose site theme. Current theme: Dark contrast')).toBeInTheDocument();
  });

  it('shows locked reward requirements in the picker', async () => {
    render(<ThemePicker themesRequireUnlock />);
    await userEvent.click(screen.getByText('Theme'));

    expect(screen.getByText('Earn in Academy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pacific blue.*Earn your first campaign star/i })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Use dark mode for Pacific blue' })).toBeDisabled();
  });

  it('toggles a bonus colour between its light and dark counterparts', async () => {
    const user = userEvent.setup();
    render(<ThemePicker themesRequireUnlock={false} />);
    await user.click(screen.getByText('Theme'));

    const modeSwitch = screen.getByRole('checkbox', { name: 'Use dark mode for Pacific blue' });
    await user.click(modeSwitch);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark-pacific-blue');
    expect(screen.getByLabelText('Choose site theme. Current theme: Pacific blue dark')).toBeInTheDocument();

    await user.click(modeSwitch);
    expect(document.documentElement).toHaveAttribute('data-theme', 'pacific-blue');
  });

  it('does not overwrite a synced bonus theme while site availability is still loading', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"neon-pink"');
    const { rerender } = render(<ThemePicker themesRequireUnlock themeAvailabilityKnown={false} />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'neon-pink');
    rerender(<ThemePicker themesRequireUnlock themeAvailabilityKnown />);

    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));
  });
});
