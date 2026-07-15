import { ArrowRight, BookOpenCheck, Clock3, Copy, FileJson, Library, Loader2, RotateCcw, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DatasetSummary } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import type { Navigate, ToastKind } from '../types';
import { copyShareLink } from '../utils/quizUi';

export function GalleryPage({ datasets, isLoading, attempts, onRefresh, navigate, onToast }: {
  datasets: DatasetSummary[];
  isLoading: boolean;
  attempts: AttemptRecord[];
  onRefresh: () => void;
  navigate: Navigate;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [section, setSection] = useState<'curated' | 'community'>('curated');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'new' | 'attempted'>('all');
  const visible = useMemo(() => datasets.filter((dataset) => {
    const belongs = section === 'curated' ? dataset.curated : !dataset.curated;
    const matchesQuery = `${dataset.title} ${dataset.description ?? ''} ${(dataset.tags ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const attempted = attempts.some((attempt) => attempt.datasetId === dataset.id);
    return belongs && matchesQuery && (status === 'all' || (status === 'attempted' ? attempted : !attempted));
  }), [datasets, section, query, status, attempts]);

  return (
    <section className="library-page">
      <header className="library-header">
        <div><span className="section-kicker light"><Library size={16} /> Exam library</span><h1>Choose how you’ll prepare.</h1><p>Curated AI-901 mock exams are blueprint-balanced and include explanations for every answer.</p></div>
        <button className="refresh-button" onClick={onRefresh} aria-label="Refresh library">{isLoading ? <Loader2 className="spin" size={18} /> : <RotateCcw size={18} />}</button>
      </header>

      <div className="library-tabs" role="tablist">
        <button className={section === 'curated' ? 'active' : ''} onClick={() => setSection('curated')}><BookOpenCheck size={18} /><span><strong>Curated exams</strong><small>Blueprint-aligned AI-901 papers</small></span></button>
        <button className={section === 'community' ? 'active' : ''} onClick={() => setSection('community')}><Users size={18} /><span><strong>Community sets</strong><small>Quizzes shared by learners</small></span></button>
      </div>

      <div className="library-toolbar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the library" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter by attempt status"><option value="all">All sets</option><option value="new">Not attempted</option><option value="attempted">Attempted</option></select>
      </div>

      {isLoading ? (
        <div className="library-empty"><Loader2 className="spin" size={28} /> Loading the library…</div>
      ) : visible.length === 0 ? (
        <div className="library-empty"><FileJson size={34} /><strong>No matching {section} sets</strong><span>Try another filter or search term.</span></div>
      ) : (
        <div className="library-grid">
          {visible.map((dataset, index) => {
            const latest = attempts.find((attempt) => attempt.datasetId === dataset.id);
            return (
              <article className={`library-card ${dataset.curated ? 'curated' : ''}`} key={dataset.id}>
                <div className="library-card-top"><span>{dataset.curated ? `Mock paper ${index + 1}` : 'Community quiz'}</span>{dataset.curated && <span className="verified-pill"><BookOpenCheck size={14} /> Curated</span>}</div>
                <h2>{dataset.title}</h2>
                <p>{dataset.description || 'A community revision set.'}</p>
                <div className="tag-row">{(dataset.tags ?? []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="library-card-meta"><span><Clock3 size={16} /> {dataset.durationMinutes ? `${dataset.durationMinutes} min` : 'Untimed'}</span><span>{dataset.itemCount} questions</span>{latest && <span className="latest-result">Last {latest.percentage}%</span>}</div>
                <footer><button className="icon-text-button" onClick={() => copyShareLink(dataset.slug, onToast)}><Copy size={15} /> Share</button><button className="primary-button" onClick={() => navigate(`/quiz/${dataset.slug}`)}>Open <ArrowRight size={17} /></button></footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
