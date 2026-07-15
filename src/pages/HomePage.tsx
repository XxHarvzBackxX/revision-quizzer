import { ArrowRight, BookOpenCheck, BrainCircuit, Clock3, Play, Sparkles, Target } from 'lucide-react';
import type { DatasetSummary } from '../../shared/quiz';
import { RecentAttempts } from '../components/Stats';
import type { ActiveExamSession, AttemptRecord } from '../storage';
import type { Navigate } from '../types';

export function HomePage({
  datasets,
  attempts,
  activeSessions,
  isLoading,
  navigate
}: {
  datasets: DatasetSummary[];
  attempts: AttemptRecord[];
  activeSessions: ActiveExamSession[];
  isLoading: boolean;
  navigate: Navigate;
}) {
  const curated = datasets.filter((dataset) => dataset.curated);
  const featured = (curated.length ? curated : datasets).slice(0, 3);
  const resumable = activeSessions.find((session) => new Date(session.expiresAt).getTime() > Date.now());
  const resumeDataset = resumable && datasets.find((dataset) => dataset.id === resumable.datasetId);
  const examAttempts = attempts.filter((attempt) => attempt.mode === 'exam');
  const best = examAttempts.reduce((current, attempt) => Math.max(current, attempt.percentage), 0);
  const completedExams = examAttempts.length;

  return (
    <div className="home-page">
      <section className="study-hero">
        <div className="hero-copy">
          <span className="hero-badge"><Sparkles size={15} /> Focused AI-901 preparation</span>
          <h1>Walk into exam day <em>ready.</em></h1>
          <p>Realistic mock exams when you want pressure. Clear explanations and focused practice when you want to learn.</p>
          <div className="hero-actions">
            {resumeDataset ? (
              <button className="primary-button large" onClick={() => navigate(`/quiz/${resumeDataset.slug}/exam`)}><Play size={18} /> Continue timed exam</button>
            ) : (
              <button className="primary-button large" onClick={() => navigate('/gallery')}><Play size={18} /> Choose a mock exam</button>
            )}
            <button className="secondary-button large" onClick={() => navigate('/gallery')}>Browse the library <ArrowRight size={18} /></button>
          </div>
          <p className="hero-disclaimer">Unofficial original practice questions, aligned to Microsoft’s April 2026 skills outline.</p>
        </div>
        <div className="readiness-card">
          <div className="readiness-top"><span>Your browser progress</span><Target size={24} /></div>
          <div className="readiness-score"><strong>{examAttempts.length ? `${best}%` : '—'}</strong><span>best mock result</span></div>
          <div className="readiness-stats">
            <div><strong>{completedExams}</strong><span>Mock exams</span></div>
            <div><strong>{attempts.length}</strong><span>Total attempts</span></div>
            <div><strong>{curated.reduce((sum, item) => sum + item.itemCount, 0)}</strong><span>Curated questions</span></div>
          </div>
        </div>
      </section>

      <section className="home-content">
        <div className="home-section-heading">
          <div><span className="section-kicker">Start studying</span><h2>AI-901 mock exams</h2><p>Three balanced papers. Two ways to use each one.</p></div>
          <button className="text-button" onClick={() => navigate('/gallery')}>View full library <ArrowRight size={17} /></button>
        </div>
        {isLoading ? (
          <div className="loading-card">Loading your exam library…</div>
        ) : (
          <div className="featured-exams">
            {featured.map((dataset, index) => {
              const latest = attempts.find((attempt) => attempt.datasetId === dataset.id);
              return (
                <article className="featured-exam-card" key={dataset.id}>
                  <div className="exam-card-top"><span className="paper-number">Paper {index + 1}</span>{dataset.curated && <span className="verified-pill"><BookOpenCheck size={14} /> Curated</span>}</div>
                  <h3>{dataset.title.replace(/^AI-901 Mock Exam \d+:?\s*/i, '') || dataset.title}</h3>
                  <p>{dataset.description}</p>
                  <div className="exam-card-facts"><span><Clock3 size={16} /> {dataset.durationMinutes ?? 45} min</span><span><BrainCircuit size={16} /> {dataset.itemCount} questions</span></div>
                  <div className="exam-card-footer"><span>{latest ? `Last result ${latest.percentage}%` : 'Not attempted yet'}</span><button className="round-arrow" onClick={() => navigate(`/quiz/${dataset.slug}`)} aria-label={`Open ${dataset.title}`}><ArrowRight size={19} /></button></div>
                </article>
              );
            })}
          </div>
        )}

        <div className="dashboard-grid">
          <RecentAttempts attempts={attempts} navigate={navigate} />
          <div className="dashboard-panel how-it-works">
            <div className="panel-heading"><div><span className="section-kicker">Two study modes</span><h2>Match the session to your goal</h2></div><BrainCircuit size={25} /></div>
            <div className="mode-summary"><span className="mode-icon serious"><Target size={20} /></span><div><strong>Serious mock exam</strong><p>45 minutes, no hints, flagging and answer review.</p></div></div>
            <div className="mode-summary"><span className="mode-icon fun"><Sparkles size={20} /></span><div><strong>Guided practice</strong><p>Instant feedback, explanations, sources and a little more energy.</p></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}
