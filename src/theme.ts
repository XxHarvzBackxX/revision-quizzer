import { useEffect, useState } from 'react';
import { readAppStorage, writeAppStorage } from './persistence';

export type ThemeId =
  | 'light'
  | 'light-contrast'
  | 'dark'
  | 'dark-contrast'
  | 'dark-purple'
  | 'mint'
  | 'pacific-blue'
  | 'dark-pacific-blue'
  | 'arcade-red'
  | 'dark-arcade-red'
  | 'sunset-orange'
  | 'dark-sunset-orange'
  | 'solar-yellow'
  | 'dark-solar-yellow'
  | 'neon-pink'
  | 'dark-neon-pink';

export type ThemeProgress = {
  level: number;
  achievementIds: readonly string[];
};

export type ThemeUnlock =
  | { achievementId: 'first-star' | 'ten-stars' | 'domain-champion' | 'certification-conqueror'; requirement: string }
  | { minimumLevel: number; requirement: string };

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
  swatches: [string, string, string];
  unlock?: ThemeUnlock;
  familyId?: string;
  variant?: 'light' | 'dark';
};

export type RewardThemeFamily = {
  id: string;
  label: string;
  description: string;
  unlock: ThemeUnlock;
  light: ThemeOption;
  dark: ThemeOption;
};

export const themeOptions: ThemeOption[] = [
  { id: 'light', label: 'Light', description: 'The original soft study palette', swatches: ['#f5f7fb', '#ffffff', '#6d5ce8'] },
  { id: 'light-contrast', label: 'Light contrast', description: 'Crisp white surfaces and stronger edges', swatches: ['#ffffff', '#f1f3f5', '#003cc5'] },
  { id: 'dark', label: 'Dark', description: 'Quiet charcoal for late sessions', swatches: ['#0d1118', '#171d28', '#58c7b2'] },
  { id: 'dark-contrast', label: 'Dark contrast', description: 'Maximum separation and bright focus', swatches: ['#000000', '#101010', '#ffdf3d'] },
  { id: 'dark-purple', label: 'Dark purple', description: 'Deep violet with arcade energy', swatches: ['#120d21', '#211733', '#a78bfa'] },
  { id: 'mint', label: 'Light mint', description: 'Fresh green-tinted reading surfaces', swatches: ['#effbf5', '#ffffff', '#087f5b'] },
  { id: 'pacific-blue', label: 'Pacific blue', description: 'Clear ocean blues for focused sessions', swatches: ['#edf6ff', '#ffffff', '#0756a3'], unlock: { achievementId: 'first-star', requirement: 'Earn your first campaign star' }, familyId: 'pacific-blue', variant: 'light' },
  { id: 'dark-pacific-blue', label: 'Pacific blue dark', description: 'Deep ocean blues for focused night sessions', swatches: ['#071522', '#0d2236', '#76baff'], unlock: { achievementId: 'first-star', requirement: 'Earn your first campaign star' }, familyId: 'pacific-blue', variant: 'dark' },
  { id: 'arcade-red', label: 'Arcade red', description: 'Bold ruby surfaces with high-score energy', swatches: ['#fff1f3', '#fffafa', '#9f1732'], unlock: { minimumLevel: 3, requirement: 'Reach Academy level 3' }, familyId: 'arcade-red', variant: 'light' },
  { id: 'dark-arcade-red', label: 'Arcade red dark', description: 'Deep crimson surfaces with high-score energy', swatches: ['#1c090e', '#2a1018', '#ff8aa2'], unlock: { minimumLevel: 3, requirement: 'Reach Academy level 3' }, familyId: 'arcade-red', variant: 'dark' },
  { id: 'sunset-orange', label: 'Sunset orange', description: 'Warm amber colour for longer study runs', swatches: ['#fff4e8', '#fffbf7', '#99400d'], unlock: { achievementId: 'ten-stars', requirement: 'Earn 10 campaign stars' }, familyId: 'sunset-orange', variant: 'light' },
  { id: 'dark-sunset-orange', label: 'Sunset orange dark', description: 'Burnished amber for low-light study runs', swatches: ['#1b0e06', '#2a170c', '#ffad6b'], unlock: { achievementId: 'ten-stars', requirement: 'Earn 10 campaign stars' }, familyId: 'sunset-orange', variant: 'dark' },
  { id: 'solar-yellow', label: 'Solar yellow', description: 'Golden highlights with grounded contrast', swatches: ['#fffbea', '#fffef7', '#6e5200'], unlock: { achievementId: 'domain-champion', requirement: 'Defeat a domain boss' }, familyId: 'solar-yellow', variant: 'light' },
  { id: 'dark-solar-yellow', label: 'Solar yellow dark', description: 'Bright gold against deep night surfaces', swatches: ['#171301', '#252006', '#f6d85f'], unlock: { achievementId: 'domain-champion', requirement: 'Defeat a domain boss' }, familyId: 'solar-yellow', variant: 'dark' },
  { id: 'neon-pink', label: 'Neon pink', description: 'A celebratory magenta endgame palette', swatches: ['#fff0f8', '#fffafd', '#9d1767'], unlock: { achievementId: 'certification-conqueror', requirement: 'Defeat a final certification boss' }, familyId: 'neon-pink', variant: 'light' },
  { id: 'dark-neon-pink', label: 'Neon pink dark', description: 'Endgame magenta glowing after dark', swatches: ['#1b0915', '#2a1022', '#ff87cc'], unlock: { achievementId: 'certification-conqueror', requirement: 'Defeat a final certification boss' }, familyId: 'neon-pink', variant: 'dark' }
];

export const rewardThemeFamilies: RewardThemeFamily[] = themeOptions.flatMap((light) => {
  if (!light.unlock || light.variant !== 'light' || !light.familyId) return [];
  const dark = themeOptions.find((option) => option.familyId === light.familyId && option.variant === 'dark');
  if (!dark) return [];
  return [{ id: light.familyId, label: light.label, description: light.description, unlock: light.unlock, light, dark }];
});

export const THEME_STORAGE_KEY = 'quiz-arcade:theme:v1';
const THEME_EVENT = 'quiz-arcade:theme-changed';

export function getStoredTheme(): ThemeId {
  try {
    const stored = readAppStorage(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
    const value: unknown = JSON.parse(stored ?? 'null');
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
    writeAppStorage(THEME_STORAGE_KEY, JSON.stringify(theme));
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
        const next = storedThemeValue(event.newValue);
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

function storedThemeValue(value: string | null): ThemeId {
  if (isThemeId(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value ?? 'null');
    return isThemeId(parsed) ? parsed : 'light';
  } catch {
    return 'light';
  }
}

export function isThemeAvailable(option: ThemeOption, themesRequireUnlock: boolean, progress: ThemeProgress): boolean {
  if (!option.unlock || !themesRequireUnlock) return true;
  if ('minimumLevel' in option.unlock) return progress.level >= option.unlock.minimumLevel;
  return progress.achievementIds.includes(option.unlock.achievementId);
}

function isThemeId(value: unknown): value is ThemeId {
  return themeOptions.some((option) => option.id === value);
}
