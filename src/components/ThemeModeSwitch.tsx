import { Moon, Sun } from 'lucide-react';
import type { RewardThemeFamily, ThemeId } from '../theme';

export function ThemeModeSwitch({ family, theme, disabled, onChange }: {
  family: RewardThemeFamily;
  theme: ThemeId;
  disabled?: boolean;
  onChange: (theme: ThemeId) => void;
}) {
  const dark = theme === family.dark.id;
  return (
    <label className="theme-mode-switch" title={`Toggle ${family.label} light or dark mode`}>
      <Sun size={12} aria-hidden="true" />
      <input
        type="checkbox"
        aria-label={`Use dark mode for ${family.label}`}
        checked={dark}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked ? family.dark.id : family.light.id)}
      />
      <span aria-hidden="true" />
      <Moon size={12} aria-hidden="true" />
    </label>
  );
}
