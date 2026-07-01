import { Play, Sparkles } from 'lucide-react';
import type { DatasetSummary } from '../../shared/quiz';
import type { ScoreRecord } from '../storage';
import type { Navigate } from '../types';
import { RecentScores, StatTile } from '../components/Stats';

export function HomePage({
  datasets,
  scores,
  isLoading,
  navigate
}: {
  datasets: DatasetSummary[];
  scores: ScoreRecord[];
  isLoading: boolean;
  navigate: Navigate;
}) {
  const featured = datasets.slice(0, 3);
  const totalQuestions = datasets.reduce((sum, dataset) => sum + dataset.itemCount, 0);
  const best = scores.reduce<ScoreRecord | null>((current, score) => {
    if (!current) return score;
    return score.score / score.total > current.score / current.total ? score : current;
  }, null);

  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={16} /> public revision arcade</p>
          <h1>Quiz Arcade</h1>
          <p>Pick a set, hit start, and get instant feedback with streaks, score flashes, and shareable public quizzes.</p>
          <div className="hero-actions">
            <button className="primary-button big" onClick={() => navigate('/gallery')}><Play size={19} /> Browse quizzes</button>
          </div>
        </div>
        <div className="arcade-console" aria-label="Quiz Arcade stats">
          <div className="console-screen">
            <span>Ready player</span>
            <strong>{scores[0] ? `${scores[0].score}/${scores[0].total}` : 'Press start'}</strong>
          </div>
          <div className="console-grid">
            <StatTile label="Public sets" value={isLoading ? '...' : datasets.length.toString()} />
            <StatTile label="Questions" value={isLoading ? '...' : totalQuestions.toString()} />
            <StatTile label="Best run" value={best ? `${best.score}/${best.total}` : '-'} />
          </div>
        </div>
      </section>

      <section className="home-sections">
        <RecentScores scores={scores} />
        <div className="feature-panel">
          <div className="panel-heading">
            <div>
              <h2>Fresh in the gallery</h2>
              <p>Recent public sets ready to play.</p>
            </div>
            <button className="ghost-button" onClick={() => navigate('/gallery')}>View all</button>
          </div>
          <div className="mini-set-list">
            {featured.length === 0 ? (
              <div className="empty-state">No public sets loaded yet.</div>
            ) : featured.map((dataset) => (
              <button className="mini-set" key={dataset.id} onClick={() => navigate(`/quiz/${dataset.slug}`)}>
                <span>{dataset.title}</span>
                <strong>{dataset.itemCount} Qs</strong>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
