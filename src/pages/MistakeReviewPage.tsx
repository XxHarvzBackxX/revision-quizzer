import { AlertTriangle, ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, CircleAlert, Loader2, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PublicDataset } from '../../shared/quiz';
import { buildReviewPool } from '../review/pool';
import {
  beginReviewSession,
  removeReviewRecord,
  reviewStatus,
  saveReviewNote,
  selectDueReviewRecords,
  useReviewState
} from '../review/storage';
import type { ReviewRecord, ReviewStatus } from '../review/types';
import type { Navigate } from '../types';

type StatusFilter = 'all' | ReviewStatus;

export function MistakeReviewPage({ datasets, isLoading, navigate }: {
  datasets: PublicDataset[];
  isLoading: boolean;
  navigate: Navigate;
}) {
  const state = useReviewState();
  const [status, setStatus] = useState<StatusFilter>('due');
  const [source, setSource] = useState(() => new URLSearchParams(window.location.search).get('source') ?? 'all');
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(10);
  const records = Object.values(state.records);
  const poolKeys = useMemo(() => new Set(buildReviewPool(records, datasets).map((entry) => entry.record.key)), [records, datasets]);
  const effectiveStatus = (record: ReviewRecord) => poolKeys.has(record.key) ? reviewStatus({ ...record, available: true }) : 'unavailable';
  const sourceOptions = [...new Map(records.map((record) => [
    record.examCode ? `exam:${record.examCode}` : `dataset:${record.datasetId}`,
    record.examCode ?? record.datasetTitle
  ])).entries()];
  const sourceMatches = (record: ReviewRecord) => source === 'all'
    || (source.startsWith('exam:') ? record.examCode === source.slice(5) : record.datasetId === source.slice(8));
  const queryMatches = (record: ReviewRecord) => `${record.prompt} ${record.datasetTitle} ${record.objectiveId ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
  const scoped = records.filter((record) => sourceMatches(record) && queryMatches(record));
  const visible = scoped.filter((record) => status === 'all' || effectiveStatus(record) === status).sort((left, right) => right.lastWrongAt.localeCompare(left.lastWrongAt));
  const due = selectDueReviewRecords(scoped.filter((record) => poolKeys.has(record.key)).map((record) => ({ ...record, available: true })), count);
  const counts = Object.fromEntries((['due', 'scheduled', 'recovered', 'unavailable'] as ReviewStatus[]).map((value) => [
    value,
    records.filter((record) => effectiveStatus(record) === value).length
  ])) as Record<ReviewStatus, number>;

  function startReview() {
    if (!due.length) return;
    beginReviewSession(due.map((record) => record.key));
    navigate('/study/mistakes/play');
  }

  return (
    <section className="mistake-review-page">
      <header className="mistake-review-hero">
        <div><span className="study-index-kicker"><BrainCircuit size={17} /> Mistake review</span><h1>Turn wrong answers<br /><em>into recovered knowledge.</em></h1><p>Quiz Arcade brings mistakes back on a short schedule. Two correct reviews on different due dates mark a question recovered.</p></div>
        <div className="mistake-review-launch">
          <span><CalendarClock size={18} /> Ready now</span>
          <strong>{counts.due}</strong>
          <p>{counts.due === 1 ? 'question is due' : 'questions are due'} across your quiz history.</p>
          <div className="review-lengths" role="group" aria-label="Review length">{[5, 10, 20].map((value) => <button className={count === value ? 'active' : ''} onClick={() => setCount(value)} key={value}>{value}</button>)}</div>
          <button className="primary-button large" disabled={!due.length || isLoading} onClick={startReview}>{isLoading ? <Loader2 className="spin" size={18} /> : null} Review {due.length || 'due'} <ArrowRight size={18} /></button>
        </div>
      </header>

      <div className="mistake-review-content">
        <div className="review-summary-grid">
          <Summary icon={<CircleAlert size={20} />} label="Due now" value={counts.due} tone="due" />
          <Summary icon={<CalendarClock size={20} />} label="Scheduled" value={counts.scheduled} tone="scheduled" />
          <Summary icon={<CheckCircle2 size={20} />} label="Recovered" value={counts.recovered} tone="recovered" />
          <Summary icon={<AlertTriangle size={20} />} label="Unavailable" value={counts.unavailable} tone="unavailable" />
        </div>

        <div className="review-toolbar">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, sources, or objectives" /></label>
          <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Filter mistake source"><option value="all">All sources</option>{sourceOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        </div>
        <div className="review-status-tabs" role="tablist">
          {(['due', 'scheduled', 'recovered', 'unavailable', 'all'] as StatusFilter[]).map((value) => <button className={status === value ? 'active' : ''} onClick={() => setStatus(value)} key={value}>{humanize(value)}{value !== 'all' ? ` ${counts[value]}` : ` ${records.length}`}</button>)}
        </div>

        {visible.length ? <div className="mistake-record-list">{visible.map((record) => <MistakeRecordCard record={record} status={effectiveStatus(record)} key={record.key} />)}</div> : (
          <div className="review-empty"><CheckCircle2 size={34} /><h2>{records.length ? 'Nothing matches these filters.' : 'No mistakes recorded yet.'}</h2><p>{records.length ? 'Try another source, status, or search.' : 'Incorrect answers from mocks, practice, and community sets will appear here automatically.'}</p><button className="secondary-button" onClick={() => navigate('/gallery')}>Browse quizzes</button></div>
        )}
      </div>
    </section>
  );
}

function MistakeRecordCard({ record, status }: { record: ReviewRecord; status: ReviewStatus }) {
  const [note, setNote] = useState(record.note ?? '');
  return <article className={`mistake-record ${status}`}>
    <header><span className={`review-status-pill ${status}`}>{humanize(status)}</span><span>{record.examCode ?? 'Community'} · {record.datasetTitle}</span><button className="icon-button" aria-label={`Remove ${record.prompt}`} onClick={() => { if (window.confirm('Remove this question from your mistake notebook? A future wrong answer will add it again.')) removeReviewRecord(record.key); }}><Trash2 size={15} /></button></header>
    <h2>{record.prompt}</h2>
    <div className="mistake-record-facts"><span>{record.wrongCount} wrong {record.wrongCount === 1 ? 'answer' : 'answers'}</span><span>{record.correctStreak}/2 recovery checks</span><span>{status === 'scheduled' ? `Due ${formatDate(record.dueOn)}` : status === 'recovered' ? `Recovered ${formatDate(record.recoveredAt)}` : status === 'unavailable' ? 'Source removed or changed' : 'Ready to review'}</span>{record.lastConfidence === 'sure' && <strong>Confident mistake</strong>}</div>
    <label className="review-note"><span>Reflection note</span><textarea maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What caused the mistake?" /><button className="text-button" disabled={note.trim() === (record.note ?? '')} onClick={() => saveReviewNote(record.key, note)}>Save note</button></label>
  </article>;
}

function Summary({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return <div className={`review-summary ${tone}`}>{icon}<span><strong>{value}</strong><small>{label}</small></span></div>;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function humanize(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
