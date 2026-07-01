import { Copy, FileJson, Library, Loader2, RotateCcw } from 'lucide-react';
import type { DatasetSummary } from '../../shared/quiz';
import type { ScoreRecord } from '../storage';
import type { Navigate, ToastKind } from '../types';
import { copyShareLink } from '../utils/quizUi';

export function GalleryPage({
  datasets,
  isLoading,
  scores,
  onRefresh,
  navigate,
  onToast
}: {
  datasets: DatasetSummary[];
  isLoading: boolean;
  scores: ScoreRecord[];
  onRefresh: () => void;
  navigate: Navigate;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  return (
    <section className="gallery-page">
      <div className="section-title">
        <p className="eyebrow"><Library size={16} /> choose your cabinet</p>
        <h1>Gallery</h1>
        <button className="icon-button" onClick={onRefresh} aria-label="Refresh gallery">
          {isLoading ? <Loader2 className="spin" size={19} /> : <RotateCcw size={19} />}
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state gallery-empty">Loading public datasets...</div>
      ) : datasets.length === 0 ? (
        <div className="empty-state gallery-empty"><FileJson size={36} /><strong>No public sets yet</strong></div>
      ) : (
        <div className="dataset-grid">
          {datasets.map((dataset, index) => {
            const lastScore = scores.find((score) => score.datasetId === dataset.id);
            return (
              <article className="dataset-card" key={dataset.id}>
                <span className="cabinet-number">#{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{dataset.title}</h3>
                  <p>{dataset.description || 'No description supplied.'}</p>
                </div>
                <div className="tag-row">{(dataset.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <footer>
                  <small>{dataset.itemCount} questions {lastScore ? `| last ${lastScore.score}/${lastScore.total}` : ''}</small>
                  <div className="card-actions">
                    <button className="ghost-button" onClick={() => copyShareLink(dataset.slug, onToast)}><Copy size={15} /> Share</button>
                    <button className="primary-button" onClick={() => navigate(`/quiz/${dataset.slug}`)}>Open</button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
