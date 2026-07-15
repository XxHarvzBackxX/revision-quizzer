import { useEffect, useState } from 'react';

export type ThemeId = 'light' | 'light-contrast' | 'dark' | 'dark-contrast' | 'dark-purple' | 'mint';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
  swatches: [string, string, string];
};

export const themeOptions: ThemeOption[] = [
  { id: 'light', label: 'Light', description: 'The original soft study palette', swatches: ['#f5f7fb', '#ffffff', '#6d5ce8'] },
  { id: 'light-contrast', label: 'Light contrast', description: 'Crisp white surfaces and stronger edges', swatches: ['#ffffff', '#f1f3f5', '#003cc5'] },
  { id: 'dark', label: 'Dark', description: 'Quiet charcoal for late sessions', swatches: ['#0d1118', '#171d28', '#58c7b2'] },
  { id: 'dark-contrast', label: 'Dark contrast', description: 'Maximum separation and bright focus', swatches: ['#000000', '#101010', '#ffdf3d'] },
  { id: 'dark-purple', label: 'Dark purple', description: 'Deep violet with arcade energy', swatches: ['#120d21', '#211733', '#a78bfa'] },
  { id: 'mint', label: 'Light mint', description: 'Fresh green-tinted reading surfaces', swatches: ['#effbf5', '#ffffff', '#087f5b'] }
];

export const THEME_STORAGE_KEY = 'quiz-arcade:theme:v1';
const THEME_EVENT = 'quiz-arcade:theme-changed';

export function getStoredTheme(): ThemeId {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(value) ? value : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme.startsWith('dark') ? 'dark' : 'light';
}

export function initializeTheme(): ThemeId {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function setTheme(theme: ThemeId): ThemeId {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme selection still applies for the current page when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  return theme;
}

export function useTheme(): [ThemeId, (theme: ThemeId) => void] {
  const [theme, updateTheme] = useState<ThemeId>(() => initializeTheme());
  useEffect(() => {
    const onChange = () => updateTheme(getStoredTheme());
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        const next = isThemeId(event.newValue) ? event.newValue : 'light';
        applyTheme(next);
        updateTheme(next);
      }
    };
    window.addEventListener(THEME_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return [theme, setTheme];
}

function isThemeId(value: unknown): value is ThemeId {
  return themeOptions.some((option) => option.id === value);
}
