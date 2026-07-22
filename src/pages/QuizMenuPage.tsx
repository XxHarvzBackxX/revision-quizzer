import { ArrowLeft, ArrowRight, BookOpen, BookOpenText, CheckCircle2, Clock3, Copy, Flag, Gamepad2, Play, Sparkles, Target } from 'lucide-react';
import type { PublicDataset } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import type { Navigate, ToastKind } from '../types';
import { copyShareLink } from '../utils/quizUi';
import { getCoursePath } from '../revision/registry';

export function QuizMenuPage({ dataset, attempts, canResume, navigate, onToast }: {
  dataset: PublicDataset;
  attempts: AttemptRecord[];
  canResume: boolean;
  navigate: Navigate;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const datasetAttempts = attempts.filter((attempt) => attempt.datasetId === dataset.id);
  const latest = datasetAttempts[0];
  const examReady = dataset.kind === 'exam' || dataset.curated;
  const revisionPath = getCoursePath(dataset.examCode);

  return (
    <section className="exam-overview-page">
      <button className="back-link" onClick={() => navigate('/gallery')}><ArrowLeft size={17} /> Back to library</button>
      <div className="overview-hero">
        <div className="overview-copy">
          <div className="overview-badges">{dataset.curated && <span className="curated-badge"><CheckCircle2 size={15} /> Curated mock exam</span>}<span>{dataset.examCode ?? 'Community set'}</span>{dataset.blueprintVersion && <span>Blueprint {dataset.blueprintVersion}</span>}</div>
          <h1>{dataset.title}</h1>
          {dataset.creator && <span className="creator-byline">Shared by @{dataset.creator.handle}</span>}
          <p>{dataset.description || 'A community revision set.'}</p>
          <div className="overview-facts"><span><BookOpen size={18} /><strong>{dataset.itemCount}</strong> questions</span><span><Clock3 size={18} /><strong>{dataset.durationMinutes ?? 'No'}</strong> {dataset.durationMinutes ? 'minutes' : 'timer'}</span><span><Target size={18} /><strong>{dataset.readinessTarget ?? 70}%</strong> practice target</span></div>
          <div className="overview-actions"><button className="icon-text-button" onClick={() => copyShareLink(dataset.slug, onToast)}><Copy size={16} /> Copy share link</button>{revisionPath && <button className="icon-text-button" onClick={() => navigate(revisionPath)}><BookOpenText size={16} /> Open RevisionWiki</button>}{dataset.examCode && <button className="icon-text-button" onClick={() => navigate(`/study/${dataset.examCode!.toLowerCase()}`)}><Gamepad2 size={16} /> Smart study plan</button>}</div>
        </div>
        <div className="overview-progress-card">
          <span>Your progress</span>
          <strong>{latest ? `${latest.percentage}%` : 'Not started'}</strong>
          <p>{latest ? `${datasetAttempts.length} attempt${datasetAttempts.length === 1 ? '' : 's'} on this browser` : 'Complete a session to see your domain breakdown.'}</p>
          {latest && <button className="text-button" onClick={() => navigate(`/quiz/${dataset.slug}/results/${latest.id}`)}>Review latest result <ArrowRight size={16} /></button>}
        </div>
      </div>

      <div className="mode-choice-heading"><span className="section-kicker">Choose your mode</span><h2>What do you need from this session?</h2></div>
      <div className="mode-choice-grid">
        {examReady && (
          <article className="mode-choice serious">
            <div className="mode-choice-icon"><Target size={26} /></div>
            <span className="mode-label">Serious mode</span>
            <h2>{canResume ? 'Continue your mock exam' : 'Simulate exam conditions'}</h2>
            <p>No answer feedback until submission. Navigate freely, flag questions, and manage the clock.</p>
            <ul><li><Clock3 size={16} /> {dataset.durationMinutes ?? 45}-minute countdown</li><li><Flag size={16} /> Flag and review questions</li><li><CheckCircle2 size={16} /> Detailed results after submission</li></ul>
            <button className="serious-button" onClick={() => navigate(`/quiz/${dataset.slug}/exam`)}><Play size={17} /> {canResume ? 'Resume exam' : 'Start mock exam'}</button>
          </article>
        )}
        <article className="mode-choice practice">
          <div className="mode-choice-icon"><Sparkles size={26} /></div>
          <span className="mode-label">Practice mode</span>
          <h2>Learn as you answer</h2>
          <p>Work through the same material with immediate feedback and official sources after every question.</p>
          <ul><li><Sparkles size={16} /> Instant answer feedback</li><li><BookOpen size={16} /> Explanations and references</li><li><Target size={16} /> Retry weaker questions</li></ul>
          <button className="practice-button" onClick={() => navigate(`/quiz/${dataset.slug}/practice`)}><Play size={17} /> Start guided practice</button>
        </article>
      </div>

      {(dataset.domains ?? []).length > 0 && (
        <section className="blueprint-card">
          <div><span className="section-kicker">Coverage</span><h2>Exam blueprint</h2><p>Each mock paper follows the current published weighting.</p></div>
          <div className="blueprint-list">{dataset.domains?.map((domain) => <div key={domain.id}><span><strong>{domain.title}</strong><small>{domain.weight}% of this paper</small></span><div className="blueprint-bar"><span style={{ width: `${domain.weight}%` }} /></div><strong>{domain.weight}%</strong></div>)}</div>
        </section>
      )}
    </section>
  );
}
