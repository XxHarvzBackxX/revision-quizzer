import { Clock3, Trophy } from 'lucide-react';
import type { AttemptRecord } from '../storage';
import type { Navigate } from '../types';

export function StatTile({ label, value }: { label: string; value: string }) {
  return <div className="stat-tile"><span>{label}</span><strong>{value}</strong></div>;
}

export function RecentAttempts({ attempts, navigate }: { attempts: AttemptRecord[]; navigate: Navigate }) {
  return (
    <div className="dashboard-panel recent-panel">
      <div className="panel-heading">
        <div><span className="section-kicker">Your activity</span><h2>Recent attempts</h2></div>
        <Trophy size={24} />
      </div>
      {attempts.length === 0 ? (
        <div className="empty-compact"><Clock3 size={23} /><span>Your completed exams and practice runs will appear here.</span></div>
      ) : (
        <div className="attempt-list">
          {attempts.slice(0, 5).map((attempt) => (
            <button className="attempt-row" key={attempt.id} onClick={() => attempt.slug && navigate(`/quiz/${attempt.slug}/results/${attempt.id}`)} disabled={!attempt.slug}>
              <span><strong>{attempt.title}</strong><small>{attempt.mode} · {formatDate(attempt.completedAt)}</small></span>
              <span className={attempt.percentage >= attempt.readinessTarget ? 'attempt-score pass' : 'attempt-score'}>{attempt.percentage}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(value));
}
