import { Trophy } from 'lucide-react';
import type { ScoreRecord } from '../storage';

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function RecentScores({ scores }: { scores: ScoreRecord[] }) {
  return (
    <div className="feature-panel recent-panel">
      <div className="panel-heading">
        <div>
          <h2>Recent scores</h2>
          <p>Your private browser history.</p>
        </div>
        <Trophy size={28} />
      </div>
      {scores.length === 0 ? (
        <div className="empty-state">No attempts yet.</div>
      ) : (
        <div className="score-list">
          {scores.slice(0, 5).map((score) => (
            <div className="score-row" key={`${score.datasetId}-${score.completedAt}`}>
              <span>{score.title}</span>
              <strong>{score.score}/{score.total}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
