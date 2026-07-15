import type { StudyConfidence } from '../../storage';

const OPTIONS: Array<{ value: StudyConfidence; label: string; hint: string }> = [
  { value: 'sure', label: 'Sure', hint: 'I know this' },
  { value: 'unsure', label: 'Unsure', hint: 'Some doubt' },
  { value: 'guess', label: 'Guess', hint: 'Best guess' }
];

export function StudyConfidencePicker({ value, onChange, disabled = false }: {
  value?: StudyConfidence;
  onChange: (value: StudyConfidence) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="confidence-picker" disabled={disabled}>
      <legend>How confident are you?</legend>
      <div>
        {OPTIONS.map((option) => (
          <button
            type="button"
            className={value === option.value ? 'active' : ''}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            key={option.value}
          >
            <strong>{option.label}</strong><small>{option.hint}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
