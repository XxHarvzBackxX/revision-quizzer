import { Check, X } from 'lucide-react';
import {
  getCorrectAnswers,
  isOptionItem,
  statementAnswerLabels,
  type QuizItem
} from '../../shared/quiz';

type ResponseProps = {
  item: QuizItem;
  options: string[];
  response: string[];
  disabled?: boolean;
  revealed?: boolean;
  appearance: 'exam' | 'practice';
  questionKey: string;
  onChange: (response: string[]) => void;
};

export function QuestionPrompt({ item, options, response, disabled, appearance, onChange }: Omit<ResponseProps, 'questionKey' | 'revealed'>) {
  if (item.type !== 'dropdown') return <h1>{item.prompt}</h1>;
  const [before, after] = item.prompt.split('{{blank}}');
  return (
    <h1 className="dropdown-question">
      {before}<select
        aria-label="Select the missing text"
        className={appearance === 'exam' ? 'exam-dropdown' : 'practice-dropdown'}
        disabled={disabled}
        value={response[0] ?? ''}
        onChange={(event) => onChange([event.target.value])}
      >
        <option value="">Select an answer</option>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>{after}
    </h1>
  );
}

export function QuestionResponseControls({ item, options, response, disabled = false, revealed = false, appearance, questionKey, onChange }: ResponseProps) {
  if (item.type === 'dropdown') return null;

  if (item.type === 'statement-group') {
    const labels = statementAnswerLabels(item.answerMode);
    return (
      <fieldset className={`${appearance}-statement-group`}>
        <legend>Answer each statement</legend>
        {item.statements.map((statement, statementIndex) => {
          const selected = response[statementIndex] ?? '';
          const expected = statement.answer ? labels[0] : labels[1];
          return (
            <div className="statement-row" key={`${questionKey}-${statementIndex}`}>
              <span><strong>{statementIndex + 1}</strong>{statement.text}</span>
              <div>
                {labels.map((label) => {
                  const checked = selected === label;
                  const state = revealed ? label === expected ? 'correct' : checked ? 'wrong' : '' : checked ? 'selected' : '';
                  return (
                    <label className={state} key={label}>
                      <input
                        type="radio"
                        name={`${questionKey}-statement-${statementIndex}`}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          const updated = Array.from({ length: item.statements.length }, (_, index) => response[index] ?? '');
                          updated[statementIndex] = label;
                          onChange(updated);
                        }}
                      />
                      <span>{label}</span>
                      {revealed && label === expected && <Check size={16} />}
                      {revealed && checked && label !== expected && <X size={16} />}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </fieldset>
    );
  }

  if (!isOptionItem(item)) return null;
  const className = appearance === 'exam' ? 'exam-options' : 'practice-options';
  return (
    <div className={className}>
      {options.map((option, optionIndex) => {
        const chosen = response.includes(option);
        const expected = getCorrectAnswers(item).includes(option);
        const state = revealed ? expected ? 'correct' : chosen ? 'wrong' : '' : chosen ? 'selected' : '';
        const nextResponse = item.type === 'multiple-choice'
          ? [option]
          : chosen ? response.filter((value) => value !== option) : [...response, option];
        if (appearance === 'practice') {
          return (
            <button className={`practice-option ${state}`} disabled={disabled} key={option} onClick={() => onChange(nextResponse)}>
              <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option}</span>
              {revealed && expected && <Check size={19} />}
              {revealed && chosen && !expected && <X size={19} />}
            </button>
          );
        }
        return (
          <label className={chosen ? 'exam-option selected' : 'exam-option'} key={option}>
            <input
              type={item.type === 'multi-select' ? 'checkbox' : 'radio'}
              name={questionKey}
              checked={chosen}
              disabled={disabled}
              onChange={() => onChange(nextResponse)}
            />
            <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

export function formatQuestionType(item: QuizItem): string {
  if (item.type === 'multi-select') return `Choose ${item.answers.length}`;
  if (item.type === 'statement-group') return item.answerMode === 'true-false' ? 'True or false' : 'Yes or no';
  if (item.type === 'dropdown') return 'Complete the statement';
  return item.type === 'multiple-choice' ? 'Choose one' : item.type.replace('-', ' ');
}
