import { Check, LockKeyhole, Palette, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { studyTotals, useStudyState } from '../study/storage';
import { isThemeAvailable, rewardThemeFamilies, themeOptions, useTheme, type RewardThemeFamily, type ThemeOption } from '../theme';
import { ThemeModeSwitch } from './ThemeModeSwitch';

export function ThemePicker({ themesRequireUnlock = true }: { themesRequireUnlock?: boolean }) {
  const [theme, selectTheme] = useTheme();
  const study = useStudyState();
  const achievementIds = Object.keys(study.academy.achievements);
  const progress = { level: studyTotals(study).level, achievementIds };
  const current = themeOptions.find((option) => option.id === theme) ?? themeOptions[0];

  useEffect(() => {
    if (!isThemeAvailable(current, themesRequireUnlock, progress)) selectTheme('light');
  }, [current.id, themesRequireUnlock, progress.level, achievementIds.join('|')]);

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

  function themeFamilyRow(family: RewardThemeFamily) {
    const available = isThemeAvailable(family.light, themesRequireUnlock, progress);
    const selected = theme === family.light.id || theme === family.dark.id;
    const displayOption = theme === family.dark.id ? family.dark : family.light;
    return (
      <div className={`theme-family-option${selected ? ' active' : ''}${available ? '' : ' locked'}`} key={family.id}>
        <button
          className="theme-family-select"
          aria-pressed={selected}
          disabled={!available}
          title={available ? displayOption.description : family.unlock.requirement}
          onClick={(event) => {
            selectTheme(family.light.id);
            event.currentTarget.closest('details')?.removeAttribute('open');
          }}
        >
          <span className="theme-swatches" aria-hidden="true">{displayOption.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span>
          <span><strong>{family.label}</strong><small>{available ? displayOption.description : family.unlock.requirement}</small></span>
          {selected ? <Check size={16} /> : !available ? <LockKeyhole size={15} /> : <Sparkles size={15} />}
        </button>
        <ThemeModeSwitch family={family} theme={theme} disabled={!available} onChange={selectTheme} />
      </div>
    );
  }

  return (
    <details className="theme-picker">
      <summary aria-label={`Choose site theme. Current theme: ${current.label}`}><Palette size={17} /><span>Theme</span></summary>
      <div className="theme-menu">
        <div className="theme-menu-heading"><span>Site appearance</span><small>Saved on this browser</small></div>
        <section className="theme-option-group">
          <div className="theme-option-group-heading"><span>Core themes</span><small>Always available</small></div>
          <div className="theme-options">{themeOptions.filter((option) => !option.unlock).map(themeButton)}</div>
        </section>
        <section className="theme-option-group">
          <div className="theme-option-group-heading"><span>Bonus themes</span><small>{themesRequireUnlock ? 'Earn in Academy' : 'Available site-wide'}</small></div>
          <div className="theme-options">{rewardThemeFamilies.map(themeFamilyRow)}</div>
        </section>
      </div>
    </details>
  );
}
