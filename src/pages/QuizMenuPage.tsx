import { Copy, Play, Trophy, Zap } from 'lucide-react';
import type { PublicDataset } from '../../shared/quiz';
import type { ScoreRecord } from '../storage';
import type { Navigate, ToastKind } from '../types';
import { StatTile } from '../components/Stats';
import { copyShareLink } from '../utils/quizUi';

export function QuizMenuPage({
  dataset,
  lastScore,
  navigate,
  onToast
}: {
  dataset: PublicDataset;
  lastScore?: ScoreRecord;
  navigate: Navigate;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const counts = dataset.items.reduce<Record<string, number>>((current, item) => {
    current[item.type] = (current[item.type] ?? 0) + 1;
    return current;
  }, {});

  return (
    <section className="quiz-menu">
      <button className="ghost-button back-button" onClick={() => navigate('/gallery')}>Gallery</button>
      <div className="marquee-panel">
        <p className="eyebrow"><Zap size={16} /> now loading</p>
        <h1>{dataset.title}</h1>
        <p>{dataset.description || 'No description supplied.'}</p>
        <div className="tag-row">{(dataset.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="menu-actions">
          <button className="primary-button big" onClick={() => navigate(`/quiz/${dataset.slug}/play`)}><Play size={19} /> Start round</button>
          <button className="ghost-button" onClick={() => copyShareLink(dataset.slug, onToast)}><Copy size={16} /> Copy link</button>
        </div>
      </div>
      <div className="quiz-menu-stats">
        <StatTile label="Questions" value={dataset.itemCount.toString()} />
        <StatTile label="Shuffle" value={dataset.shuffleQuestions ? 'On' : 'Off'} />
        <StatTile label="Multiple choice" value={(counts['multiple-choice'] ?? 0).toString()} />
        <StatTile label="Free write" value={(counts['free-write'] ?? 0).toString()} />
        <StatTile label="Flashcards" value={(counts.flashcard ?? 0).toString()} />
        <div className="last-score-card">
          <Trophy size={26} />
          <span>Last score</span>
          <strong>{lastScore ? `${lastScore.score}/${lastScore.total}` : 'No run yet'}</strong>
        </div>
      </div>
    </section>
  );
}
