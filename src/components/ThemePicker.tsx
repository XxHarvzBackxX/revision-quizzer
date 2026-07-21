import { Check, LockKeyhole, Palette, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { studyTotals, useStudyState } from '../study/storage';
import { isThemeAvailable, themeOptions, useTheme, type ThemeOption } from '../theme';

export function ThemePicker({ themesRequireUnlock = true }: { themesRequireUnlock?: boolean }) {
  const [theme, selectTheme] = useTheme();
  const study = useStudyState();
  const achievementIds = Object.keys(study.academy.achievements);
  const progress = { level: studyTotals(study).level, achievementIds };
  const current = themeOptions.find((option) => option.id === theme) ?? themeOptions[0];

  useEffect(() => {
    if (!isThemeAvailable(current, themesRequireUnlock, progress)) selectTheme('light');
  }, [current.id, themesRequireUnlock, progress.level, achievementIds.join('|')]);

  const groups = [
    { label: 'Core themes', hint: 'Always available', options: themeOptions.filter((option) => !option.unlock) },
    { label: 'Bonus themes', hint: themesRequireUnlock ? 'Earn in Academy' : 'Available site-wide', options: themeOptions.filter((option) => option.unlock) }
  ];

  function themeButton(option: ThemeOption) {
    const available = isThemeAvailable(option, themesRequireUnlock, progress);
    return (
      <button
        className={option.id === theme ? 'active' : ''}
        aria-pressed={option.id === theme}
        disabled={!available}
        title={available ? option.description : option.unlock?.requirement}
        onClick={(event) => {
          selectTheme(option.id);
          event.currentTarget.closest('details')?.removeAttribute('open');
        }}
        key={option.id}
      >
        <span className="theme-swatches" aria-hidden="true">{option.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span>
        <span>
          <strong>{option.label}</strong>
          <small>{available ? option.description : option.unlock?.requirement}</small>
        </span>
        {option.id === theme ? <Check size={16} /> : !available ? <LockKeyhole size={15} /> : option.unlock ? <Sparkles size={15} /> : null}
      </button>
    );
  }

  return (
    <details className="theme-picker">
      <summary aria-label={`Choose site theme. Current theme: ${current.label}`}><Palette size={17} /><span>Theme</span></summary>
      <div className="theme-menu">
        <div className="theme-menu-heading"><span>Site appearance</span><small>Saved on this browser</small></div>
        {groups.map((group) => <section className="theme-option-group" key={group.label}>
          <div className="theme-option-group-heading"><span>{group.label}</span><small>{group.hint}</small></div>
          <div className="theme-options">{group.options.map(themeButton)}</div>
        </section>)}
      </div>
    </details>
  );
}
