import { Check, Palette } from 'lucide-react';
import { themeOptions, useTheme } from '../theme';

export function ThemePicker() {
  const [theme, selectTheme] = useTheme();
  const current = themeOptions.find((option) => option.id === theme) ?? themeOptions[0];
  return (
    <details className="theme-picker">
      <summary aria-label={`Choose site theme. Current theme: ${current.label}`}><Palette size={17} /><span>Theme</span></summary>
      <div className="theme-menu">
        <div className="theme-menu-heading"><span>Site appearance</span><small>Saved on this browser</small></div>
        <div className="theme-options">
          {themeOptions.map((option) => (
            <button
              className={option.id === theme ? 'active' : ''}
              aria-pressed={option.id === theme}
              onClick={(event) => {
                selectTheme(option.id);
                event.currentTarget.closest('details')?.removeAttribute('open');
              }}
              key={option.id}
            >
              <span className="theme-swatches" aria-hidden="true">{option.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span>
              <span><strong>{option.label}</strong><small>{option.description}</small></span>
              {option.id === theme && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
