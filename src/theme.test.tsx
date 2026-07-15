// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemePicker } from './components/ThemePicker';
import { applyTheme, getStoredTheme, setTheme, THEME_STORAGE_KEY, themeOptions } from './theme';

describe('site themes', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
  });
  afterEach(cleanup);

  it('falls back safely and exposes all six requested palettes', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'unknown');
    expect(getStoredTheme()).toBe('light');
    expect(themeOptions.map((theme) => theme.id)).toEqual(['light', 'light-contrast', 'dark', 'dark-contrast', 'dark-purple', 'mint']);
  });

  it('applies and persists light and dark colour schemes', () => {
    setTheme('dark-purple');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark-purple');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark-purple');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    applyTheme('mint');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('changes theme through the accessible top-bar picker', async () => {
    render(<ThemePicker />);
    await userEvent.click(screen.getByText('Theme'));
    await userEvent.click(screen.getByRole('button', { name: /Dark contrast/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark-contrast');
    expect(screen.getByLabelText('Choose site theme. Current theme: Dark contrast')).toBeInTheDocument();
  });
});
