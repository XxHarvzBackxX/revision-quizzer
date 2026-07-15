import { BookOpenText, Check, ChevronLeft, ChevronRight, ExternalLink, Flag, Lightbulb, Sparkles, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PublicDataset, QuizItem } from '../../shared/quiz';
import { answerSimilarity, getCorrectAnswers, isFreeWritePass, isObjectiveItem, isResponseCorrect } from '../../shared/quiz';
import type { ActiveExamSession, AttemptRecord } from '../storage';
import type { Navigate } from '../types';
import { buildAttempt, createExamSession, getOrderedQuestions } from '../utils/exam';
import { revisionPathForObjective } from '../revision/registry';

export function QuizPlayPage({
  dataset,
  navigate,
  onAttempt
}: {
  dataset: PublicDataset;
  navigate: Navigate;
  onAttempt: (attempt: AttemptRecord) => void;
}) {
  const [session, setSession] = useState<ActiveExamSession>(() => createPracticeSession(dataset));
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [effect, setEffect] = useState<'correct' | 'wrong' | ''>('');
  const questions = useMemo(() => getOrderedQuestions(dataset, session), [dataset, session.itemOrder, session.optionOrders]);
  const current = questions[session.currentIndex] ?? questions[0];
  const selected = current ? session.answers[String(current.originalIndex)] ?? [] : [];
  const progress = questions.length ? Math.round(((session.currentIndex + (revealed ? 1 : 0)) / questions.length) * 100) : 0;
  const runningScore = questions.slice(0, session.currentIndex + (revealed ? 1 : 0)).filter((question) => (
    isResponseCorrect(question.item, session.answers[String(question.originalIndex)] ?? [])
  )).length;

  function updateObjectiveResponse(value: string) {
    if (!current || !isObjectiveItem(current.item) || revealed) return;
    setSession((existing) => {
      const key = String(current.originalIndex);
      const chosen = existing.answers[key] ?? [];
      const response = current.item.type === 'multiple-choice'
        ? [value]
        : chosen.includes(value)
          ? chosen.filter((option) => option !== value)
          : [...chosen, value];
      return { ...existing, answers: { ...existing.answers, [key]: response } };
    });
  }

  function reveal(response?: string[]) {
    if (!current) return;
    const resolved = response ?? selected;
    setSession((existing) => ({
      ...existing,
      answers: { ...existing.answers, [String(current.originalIndex)]: resolved }
    }));
    const correct = isResponseCorrect(current.item, resolved);
    setEffect(correct ? 'correct' : 'wrong');
    setRevealed(true);
  }

  function next() {
    if (!current) return;
    setEffect('');
    setRevealed(false);
    setTyped('');
    if (session.currentIndex < questions.length - 1) {
      setSession((existing) => ({ ...existing, currentIndex: existing.currentIndex + 1 }));
      return;
    }
    const attempt = buildAttempt({ dataset, mode: 'practice', session });
    onAttempt(attempt);
    navigate(`/quiz/${dataset.slug}/results/${attempt.id}`);
  }

  if (!current) return null;
  const correct = revealed && isResponseCorrect(current.item, selected);
  const similarity = current.item.type === 'free-write' ? answerSimilarity(typed, current.item.answer) : 0;
  const revisionPath = revisionPathForObjective(dataset.examCode, current.item.objectiveId);

  return (
    <section className={`practice-shell effect-${effect}`}>
      {effect === 'correct' && <div className="confetti-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>}
      <header className="practice-header">
        <button className="quiet-button light" onClick={() => navigate(`/quiz/${dataset.slug}`)}><ChevronLeft size={17} /> Exit practice</button>
        <div><strong>{dataset.title}</strong><span>Question {session.currentIndex + 1} of {questions.length}</span></div>
        <div className="practice-score"><Zap size={16} /> {runningScore} correct</div>
      </header>
      <div className="practice-progress"><span style={{ width: `${progress}%` }} /></div>

      <article className="practice-card">
        <div className="question-context">
          <span>{formatType(current.item)}</span>
          {current.item.difficulty && <span>{current.item.difficulty}</span>}
          {current.item.domainId && <span>{domainTitle(dataset, current.item.domainId)}</span>}
        </div>
        <h1>{current.item.prompt}</h1>

        {isObjectiveItem(current.item) && (
          <div className="practice-options">
            {current.options.map((option, optionIndex) => {
              const chosen = selected.includes(option);
              const expected = getCorrectAnswers(current.item).includes(option);
              const state = revealed ? expected ? 'correct' : chosen ? 'wrong' : '' : chosen ? 'selected' : '';
              return (
                <button className={`practice-option ${state}`} disabled={revealed} key={option} onClick={() => updateObjectiveResponse(option)}>
                  <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                  <span>{option}</span>
                  {revealed && expected && <Check size={19} />}
                  {revealed && chosen && !expected && <X size={19} />}
                </button>
              );
            })}
            {!revealed && (
              <button
                className="primary-button check-answer"
                disabled={selected.length === 0 || (current.item.type === 'multi-select' && selected.length !== current.item.answers.length)}
                onClick={() => reveal()}
              >Check answer</button>
            )}
          </div>
        )}

        {current.item.type === 'free-write' && (
          <div className="written-answer">
            <input value={typed} disabled={revealed} onChange={(event) => setTyped(event.target.value)} placeholder="Type your answer" />
            {!revealed && <button className="primary-button" disabled={!typed.trim()} onClick={() => reveal([typed])}>Check answer</button>}
            {revealed && <p className={isFreeWritePass(typed, current.item.answer) ? 'feedback pass' : 'feedback fail'}>{Math.round(similarity * 100)}% match. Expected: <strong>{current.item.answer}</strong></p>}
          </div>
        )}

        {current.item.type === 'flashcard' && (
          <div className="flashcard-answer">
            {!revealed ? (
              <button className="primary-button" onClick={() => { setRevealed(true); setEffect(''); }}>Reveal answer</button>
            ) : selected.length === 0 ? (
              <>
                <div className="answer-reveal">{current.item.answer}</div>
                <p>Did you recall it correctly?</p>
                <div className="button-row">
                  <button className="primary-button" onClick={() => reveal([getCorrectAnswers(current.item)[0]])}><Check size={17} /> Yes</button>
                  <button className="secondary-button" onClick={() => reveal([''])}><X size={17} /> Not yet</button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {revealed && selected.length > 0 && (
          <div className={`learning-feedback ${correct ? 'correct' : 'wrong'}`}>
            <div className="feedback-heading">{correct ? <Check size={21} /> : <Lightbulb size={21} />}<strong>{correct ? 'Correct' : 'Good attempt'}</strong></div>
            <p>{current.item.explanation || `The expected answer is ${getCorrectAnswers(current.item).join(' and ')}.`}</p>
            {current.item.objectiveId && <small>Objective: {humanize(current.item.objectiveId)}</small>}
            {revisionPath && <button className="feedback-revision-link" onClick={() => navigate(revisionPath)}><BookOpenText size={14} /> Revise this topic</button>}
            {(current.item.references ?? []).map((reference) => (
              <a href={reference.url} target="_blank" rel="noreferrer" key={reference.url}>{reference.title} <ExternalLink size={14} /></a>
            ))}
          </div>
        )}

        {revealed && selected.length > 0 && (
          <button className="primary-button practice-next" onClick={next}>
            {session.currentIndex === questions.length - 1 ? 'See results' : 'Next question'} <ChevronRight size={18} />
          </button>
        )}
      </article>
      <p className="practice-note"><Sparkles size={15} /> Practice mode shows explanations as you go. Use serious mode when you want exam conditions.</p>
    </section>
  );
}

function createPracticeSession(dataset: PublicDataset): ActiveExamSession {
  const session = createExamSession(dataset);
  try {
    const key = `quiz-arcade:retry:${dataset.id}`;
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (raw) {
      const indexes = JSON.parse(raw) as number[];
      session.itemOrder = session.itemOrder.filter((index) => indexes.includes(index));
    }
  } catch {
    // A normal full practice run is a safe fallback.
  }
  return session;
}

function formatType(item: QuizItem): string {
  if (item.type === 'multi-select') return `Choose ${item.answers.length}`;
  return item.type.replace('-', ' ');
}

function domainTitle(dataset: PublicDataset, id: string): string {
  return dataset.domains?.find((domain) => domain.id === id)?.title ?? humanize(id);
}

function humanize(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
