import { Check, RotateCcw, Sparkles, Trophy, X, Zap } from 'lucide-react';
import { useState } from 'react';
import type { PublicDataset, QuizItem } from '../../shared/quiz';
import { answerSimilarity, isFreeWritePass } from '../../shared/quiz';
import type { ScoreRecord } from '../storage';
import type { Navigate, ToastKind } from '../types';

export function QuizPlayPage({
  dataset,
  navigate,
  onScore,
  onToast
}: {
  dataset: PublicDataset;
  navigate: Navigate;
  onScore: (score: ScoreRecord) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [effect, setEffect] = useState<'correct' | 'wrong' | ''>('');
  const [scorePopup, setScorePopup] = useState('');
  const item = dataset.items[index];
  const progress = Math.round(((index + (completed ? 1 : 0)) / dataset.items.length) * 100);
  const streakLabel = pendingPoints && revealed ? 'Hit!' : score > 0 ? `${score} banked` : 'Warm up';

  function check(points: number) {
    setPendingPoints(points);
    setRevealed(true);
    setEffect(points ? 'correct' : 'wrong');
    setScorePopup(points ? '+1' : 'No point');
  }

  function revealFlashcard() {
    setRevealed(true);
    setEffect('');
  }

  function next() {
    const nextScore = score + pendingPoints;
    setScore(nextScore);
    setEffect('');
    setScorePopup('');

    if (index < dataset.items.length - 1) {
      setIndex(index + 1);
      setSelected('');
      setTyped('');
      setRevealed(false);
      setPendingPoints(0);
      return;
    }

    setCompleted(true);
    onScore({ datasetId: dataset.id, title: dataset.title, score: nextScore, total: dataset.items.length, completedAt: new Date().toISOString() });
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setSelected('');
    setTyped('');
    setRevealed(false);
    setPendingPoints(0);
    setCompleted(false);
    setEffect('');
  }

  if (completed) {
    return <ResultPanel dataset={dataset} score={score} onBack={() => navigate(`/quiz/${dataset.slug}`)} onRestart={restart} />;
  }

  return (
    <section className={`quiz-stage ${effect ? `effect-${effect}` : ''}`}>
      {effect === 'correct' && <div className="confetti-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>}
      {scorePopup && <div className={`score-popup ${pendingPoints ? 'gain' : 'miss'}`} key={`${index}-${scorePopup}`}>{scorePopup}</div>}
      <div className="quiz-hud">
        <button className="ghost-button" onClick={() => navigate(`/quiz/${dataset.slug}`)}>Menu</button>
        <div className="hud-center">
          <strong>{dataset.title}</strong>
          <span>{index + 1} of {dataset.items.length}</span>
        </div>
        <div className="score-chip"><Zap size={16} /> {score + (revealed ? pendingPoints : 0)} pts</div>
      </div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="streak-ribbon">{streakLabel}</div>
      <QuizCard
        item={item}
        selected={selected}
        typed={typed}
        revealed={revealed}
        pendingPoints={pendingPoints}
        onSelect={setSelected}
        onTyped={setTyped}
        onCheck={check}
        onRevealFlashcard={revealFlashcard}
        onOverride={() => {
          setPendingPoints(1);
          setEffect('correct');
          setScorePopup('+1');
        }}
        onNext={next}
      />
    </section>
  );
}

function QuizCard({
  item,
  selected,
  typed,
  revealed,
  pendingPoints,
  onSelect,
  onTyped,
  onCheck,
  onRevealFlashcard,
  onOverride,
  onNext
}: {
  item: QuizItem;
  selected: string;
  typed: string;
  revealed: boolean;
  pendingPoints: number;
  onSelect: (value: string) => void;
  onTyped: (value: string) => void;
  onCheck: (points: number) => void;
  onRevealFlashcard: () => void;
  onOverride: () => void;
  onNext: () => void;
}) {
  const similarity = item.type === 'free-write' ? answerSimilarity(typed, item.answer) : 0;

  return (
    <article className="quiz-card">
      <span className="type-pill">{item.type.replace('-', ' ')}</span>
      <h2>{item.prompt}</h2>
      {item.type === 'flashcard' && (
        <div className="answer-zone">
          {revealed ? (
            <>
              <p className="answer-text">{item.answer}</p>
              <p>Did you get it?</p>
              <div className="button-row">
                <button className={pendingPoints === 1 ? 'primary-button' : 'ghost-button'} onClick={() => onCheck(1)}><Check size={17} /> Yes</button>
                <button className={revealed && pendingPoints === 0 ? 'danger-button' : 'ghost-button'} onClick={() => onCheck(0)}><X size={17} /> No</button>
                <button className="primary-button" onClick={onNext}>Next</button>
              </div>
            </>
          ) : (
            <>
              <p>Lock in your answer mentally, then reveal it.</p>
              <button className="primary-button" onClick={onRevealFlashcard}>Reveal</button>
            </>
          )}
        </div>
      )}
      {item.type === 'multiple-choice' && (
        <div className="option-grid">
          {item.options.map((option) => {
            const isCorrect = option === item.answer;
            const isPicked = selected === option;
            const className = revealed && isCorrect ? 'option correct' : revealed && isPicked ? 'option wrong' : 'option';
            return (
              <button className={className} disabled={revealed} key={option} onClick={() => { onSelect(option); onCheck(isCorrect ? 1 : 0); }}>
                {revealed && isCorrect ? <Check size={17} /> : revealed && isPicked ? <X size={17} /> : null}
                {option}
              </button>
            );
          })}
          {revealed && <button className="primary-button next-button" onClick={onNext}>Next</button>}
        </div>
      )}
      {item.type === 'free-write' && (
        <div className="answer-zone">
          <input value={typed} disabled={revealed} onChange={(event) => onTyped(event.target.value)} placeholder="Type your answer" />
          {revealed ? (
            <>
              <p className={isFreeWritePass(typed, item.answer) ? 'feedback pass' : 'feedback fail'}>
                {Math.round(similarity * 100)}% match. Expected: <strong>{item.answer}</strong>
              </p>
              {!isFreeWritePass(typed, item.answer) && <button className="ghost-button" onClick={onOverride}>Mark correct</button>}
              <button className="primary-button" onClick={onNext}>Next</button>
            </>
          ) : (
            <button className="primary-button" disabled={!typed.trim()} onClick={() => onCheck(isFreeWritePass(typed, item.answer) ? 1 : 0)}>Check answer</button>
          )}
        </div>
      )}
    </article>
  );
}

function ResultPanel({ dataset, score, onBack, onRestart }: { dataset: PublicDataset; score: number; onBack: () => void; onRestart: () => void }) {
  const percent = Math.round((score / dataset.items.length) * 100);
  return (
    <section className="result-panel">
      <div className="result-medal"><Trophy size={54} /></div>
      <p className="eyebrow"><Sparkles size={16} /> round complete</p>
      <h1>{percent}%</h1>
      <p>{score}/{dataset.items.length} correct on {dataset.title}</p>
      <div className="button-row">
        <button className="primary-button big" onClick={onRestart}><RotateCcw size={18} /> Replay</button>
        <button className="ghost-button" onClick={onBack}>Quiz menu</button>
      </div>
    </section>
  );
}
