import { ArrowLeft, ArrowRight, Bookmark, BrainCircuit, CheckCircle2, Flame, Layers3, Loader2, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DatasetSummary, Difficulty, PublicDataset } from '../../shared/quiz';
import { getRevisionCourse } from '../revision/registry';
import type { AttemptRecord } from '../storage';
import { calculateCertificationMastery } from '../study/mastery';
import { buildCertificationPool, filterStudyPool, selectDrillQuestionKeys } from '../study/pool';
import { beginStudyDrill, useStudyState } from '../study/storage';
import type { StudyPoolFilter } from '../study/types';
import type { Navigate, ToastKind } from '../types';

const FILTERS: Array<{ id: StudyPoolFilter; label: string; description: string; icon: React.ReactNode }> = [
  { id: 'weakest', label: 'Weakest areas', description: 'Prioritise your lowest mastery objectives', icon: <Target size={19} /> },
  { id: 'missed', label: 'Missed before', description: 'Revisit questions answered incorrectly', icon: <BrainCircuit size={19} /> },
  { id: 'bookmarked', label: 'Bookmarked', description: 'Practise your saved question bank', icon: <Bookmark size={19} /> },
  { id: 'unseen', label: 'Unseen topics', description: 'Build evidence in untouched objectives', icon: <Flame size={19} /> },
  { id: 'all', label: 'All questions', description: 'Draw from every built-in paper', icon: <Layers3 size={19} /> }
];

export function StudyDrillSetupPage({ examCode, datasets, allDatasetSummaries, attempts, isLoading, navigate, onToast }: {
  examCode: string;
  datasets: PublicDataset[];
  allDatasetSummaries: DatasetSummary[];
  attempts: AttemptRecord[];
  isLoading: boolean;
  navigate: Navigate;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const course = getRevisionCourse(examCode);
  const study = useStudyState();
  const query = new URLSearchParams(window.location.search);
  const suggestedObjective = query.get('objective') ?? '';
  const initialFilter = FILTERS.some((item) => item.id === query.get('filter')) ? query.get('filter') as StudyPoolFilter : suggestedObjective ? 'all' : 'weakest';
  const [filter, setFilter] = useState<StudyPoolFilter>(initialFilter);
  const [objectiveId, setObjectiveId] = useState(suggestedObjective);
  const [domainId, setDomainId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [count, setCount] = useState(10);
  const pool = useMemo(() => buildCertificationPool(examCode, datasets), [examCode, datasets]);
  const mastery = course ? calculateCertificationMastery({ examCode, attempts, datasets: allDatasetSummaries, course }) : [];
  const matchingAttempts = attempts.filter((attempt) => attempt.examCode?.toUpperCase() === examCode.toUpperCase() || datasets.some((dataset) => dataset.id === attempt.datasetId));
  const candidates = filterStudyPool({
    pool,
    filter,
    objectiveId: objectiveId || undefined,
    domainId: domainId || undefined,
    difficulty: difficulty || undefined,
    mastery,
    attempts: matchingAttempts,
    bookmarks: study.bookmarks
  });

  if (!course) return <section className="result-empty"><Target size={38} /><h1>Drill unavailable</h1><button className="primary-button" onClick={() => navigate('/gallery')}>Browse certifications</button></section>;

  function startDrill() {
    if (!candidates.length) {
      onToast('info', 'No questions match those filters yet. Try a broader question pool.');
      return;
    }
    const seed = Date.now().toString(36);
    const createdAt = new Date().toISOString();
    const questionKeys = selectDrillQuestionKeys(candidates, Math.min(count, candidates.length), seed);
    beginStudyDrill({
      examCode: course!.examCode,
      filter,
      objectiveId: objectiveId || undefined,
      domainId: domainId || undefined,
      difficulty: difficulty || undefined,
      count: questionKeys.length,
      questionKeys,
      seed,
      createdAt
    });
    navigate(`/study/${course!.examCode.toLowerCase()}/drill/play`);
  }

  return (
    <section className="drill-setup-page" style={{ '--course-accent': course.accent } as React.CSSProperties}>
      <button className="back-link" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}`)}><ArrowLeft size={17} /> {course.examCode} study plan</button>
      <header><span className="study-kicker"><Target size={16} /> Custom practice</span><h1>Build a targeted drill.</h1><p>Draw from all three built-in {course.examCode} papers without changing your realistic mock-exam attempts.</p></header>

      {isLoading ? <div className="study-loading"><Loader2 className="spin" size={26} /> Loading the certification question pool…</div> : (
        <div className="drill-builder-grid">
          <main>
            <section className="drill-section"><span className="section-kicker">1 · Question pool</span><h2>What should this session target?</h2><div className="drill-filter-grid">{FILTERS.map((item) => <button className={filter === item.id ? 'active' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} key={item.id}>{item.icon}<span><strong>{item.label}</strong><small>{item.description}</small></span>{filter === item.id && <CheckCircle2 size={17} />}</button>)}</div></section>

            <section className="drill-section"><span className="section-kicker">2 · Fine tune</span><h2>Narrow the selection</h2><div className="drill-select-grid">
              <label>Objective<select value={objectiveId} onChange={(event) => setObjectiveId(event.target.value)}><option value="">All objectives</option>{course.pages.map((page) => <option value={page.objectiveId} key={page.objectiveId}>{page.title}</option>)}</select></label>
              <label>Domain<select value={domainId} onChange={(event) => setDomainId(event.target.value)}><option value="">All domains</option>{course.domains.map((domain) => <option value={domain.id} key={domain.id}>{domain.title}</option>)}</select></label>
              <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty | '')}><option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
            </div></section>

            <section className="drill-section"><span className="section-kicker">3 · Session length</span><h2>How long do you have?</h2><div className="drill-lengths">{[5, 10, 20, 30, 50].map((value) => <button className={count === value ? 'active' : ''} aria-pressed={count === value} onClick={() => setCount(value)} key={value}><strong>{value}</strong><span>questions</span></button>)}<label><span>Custom</span><input aria-label="Custom question count" type="number" min="1" max="50" value={count} onChange={(event) => setCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} /><small>1–50</small></label></div></section>
          </main>

          <aside className="drill-summary">
            <span className="section-kicker">Your session</span>
            <strong>{Math.min(count, candidates.length)}</strong><h2>{Math.min(count, candidates.length) === 1 ? 'question ready' : 'questions ready'}</h2>
            <p>From {pool.length} curated questions across {datasets.length} built-in papers.</p>
            <dl><div><dt>Pool</dt><dd>{FILTERS.find((item) => item.id === filter)?.label}</dd></div><div><dt>Objective</dt><dd>{course.pages.find((page) => page.objectiveId === objectiveId)?.title ?? 'All'}</dd></div><div><dt>Difficulty</dt><dd>{difficulty || 'Mixed'}</dd></div></dl>
            {candidates.length < count && candidates.length > 0 && <p className="drill-notice">Only {candidates.length} questions currently match, so the drill will use all of them.</p>}
            {candidates.length === 0 && !isLoading && <p className="drill-notice warning">No questions match. Broaden a filter to continue.</p>}
            <button className="primary-button large" disabled={!candidates.length} onClick={startDrill}>Start drill <ArrowRight size={18} /></button>
          </aside>
        </div>
      )}
    </section>
  );
}
