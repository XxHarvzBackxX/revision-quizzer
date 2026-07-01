import { Check, Copy, FileJson, Gamepad2, Loader2, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchDataset, fetchDatasets, uploadDataset } from './api';
import { getScores, saveScore, type ScoreRecord } from './storage';
import {
  answerSimilarity,
  isFreeWritePass,
  type DatasetInput,
  type DatasetSummary,
  type PublicDataset,
  type QuizItem,
  validateDataset
} from '../shared/quiz';

type View = 'gallery' | 'upload' | 'quiz';
type UploadState = {
  raw: string;
  key: string;
  dataset: DatasetInput | null;
  errors: string[];
};
type ToastKind = 'success' | 'error' | 'info';
type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

const sampleDataset = JSON.stringify(
  {
    title: 'Biology Basics',
    description: 'A tiny starter set for testing Quiz Arcade.',
    tags: ['biology', 'starter'],
    items: [
      { type: 'flashcard', prompt: 'What does the nucleus do?', answer: "Controls the cell's activities" },
      { type: 'free-write', prompt: 'What process do plants use to make glucose?', answer: 'Photosynthesis' },
      {
        type: 'multiple-choice',
        prompt: 'Which organelle releases energy?',
        answer: 'Mitochondria',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cell wall']
      }
    ]
  },
  null,
  2
);

export function App() {
  const [view, setView] = useState<View>('gallery');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState<PublicDataset | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>(() => getScores());
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    void loadGallery();
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/quiz\/([^/]+)$/);
    if (match?.[1]) {
      void startDataset(decodeURIComponent(match[1]));
    }
  }, []);

  async function loadGallery() {
    setIsLoading(true);
    try {
      setDatasets(await fetchDatasets());
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not load datasets.');
    } finally {
      setIsLoading(false);
    }
  }

  async function startDataset(id: string) {
    setIsLoading(true);
    try {
      setActiveDataset(await fetchDataset(id));
      setView('quiz');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not load dataset.');
    } finally {
      setIsLoading(false);
    }
  }

  function notify(kind: ToastKind, message: string) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5200);
  }

  function handleScore(score: ScoreRecord) {
    saveScore(score);
    setScores(getScores());
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => setView('gallery')} aria-label="Open gallery">
          <span className="brand-mark">
            <Gamepad2 size={24} />
          </span>
          <span>
            <strong>Quiz Arcade</strong>
            <small>Public revision sets</small>
          </span>
        </button>
        <nav className="nav-actions">
          <button className={view === 'gallery' ? 'nav-button active' : 'nav-button'} onClick={() => setView('gallery')}>
            Gallery
          </button>
          <button className={view === 'upload' ? 'nav-button active' : 'nav-button'} onClick={() => setView('upload')}>
            <Upload size={17} />
            Upload
          </button>
        </nav>
      </header>

      <section className="hero-band">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> revision, but playable</p>
          <h1>Quiz Arcade</h1>
          <p>Upload public JSON question sets, browse shared decks, and run fast revision rounds with clear feedback.</p>
        </div>
        <div className="score-strip" aria-label="Recent scores">
          <span>Recent scores</span>
          {scores.length === 0 ? (
            <strong>No attempts yet</strong>
          ) : (
            <strong>{scores[0].score}/{scores[0].total} on {scores[0].title}</strong>
          )}
        </div>
      </section>

      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      {view === 'gallery' && (
        <Gallery
          datasets={datasets}
          isLoading={isLoading}
          scores={scores}
          onRefresh={loadGallery}
          onStart={startDataset}
          onUpload={() => setView('upload')}
          onToast={notify}
        />
      )}

      {view === 'upload' && (
        <UploadPanel
          onToast={notify}
          onUploaded={(dataset) => {
            const { items: _items, ...summary } = dataset;
            setDatasets((current) => [summary, ...current]);
            setActiveDataset(dataset);
            setView('quiz');
            notify('success', `"${dataset.title}" is live in the public gallery.`);
          }}
        />
      )}

      {view === 'quiz' && activeDataset && (
        <QuizRunner dataset={activeDataset} onBack={() => setView('gallery')} onScore={handleScore} />
      )}
    </main>
  );
}

function Gallery({
  datasets,
  isLoading,
  scores,
  onRefresh,
  onStart,
  onUpload,
  onToast
}: {
  datasets: DatasetSummary[];
  isLoading: boolean;
  scores: ScoreRecord[];
  onRefresh: () => void;
  onStart: (id: string) => void;
  onUpload: () => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  return (
    <section className="content-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <h2>Public gallery</h2>
            <p>Pick a shared revision set and start a round.</p>
          </div>
          <button className="icon-button" onClick={onRefresh} aria-label="Refresh gallery">
            {isLoading ? <Loader2 className="spin" size={19} /> : <RotateCcw size={19} />}
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading public datasets...</div>
        ) : datasets.length === 0 ? (
          <div className="empty-state">
            <FileJson size={36} />
            <strong>No public sets yet</strong>
            <button className="primary-button" onClick={onUpload}>Upload the first one</button>
          </div>
        ) : (
          <div className="dataset-grid">
            {datasets.map((dataset) => {
              const lastScore = scores.find((score) => score.datasetId === dataset.id);
              return (
                <article className="dataset-card" key={dataset.id}>
                  <div>
                    <h3>{dataset.title}</h3>
                    <p>{dataset.description || 'No description supplied.'}</p>
                  </div>
                  <div className="tag-row">
                    {(dataset.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <footer>
                    <small>{dataset.itemCount} questions {lastScore ? `| last ${lastScore.score}/${lastScore.total}` : ''}</small>
                    <div className="card-actions">
                      <button className="ghost-button" onClick={() => copyShareLink(dataset.slug, onToast)}>
                        <Copy size={15} /> Share
                      </button>
                      <button className="primary-button" onClick={() => onStart(dataset.slug)}>Start</button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function UploadPanel({
  onUploaded,
  onToast
}: {
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [state, setState] = useState<UploadState>({ raw: sampleDataset, key: '', dataset: null, errors: [] });
  const [isUploading, setIsUploading] = useState(false);

  const parsed = useMemo(() => parseDataset(state.raw), [state.raw]);

  useEffect(() => {
    setState((current) => ({ ...current, dataset: parsed.dataset, errors: parsed.errors }));
  }, [parsed.dataset, parsed.errors]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const raw = await file.text();
    setState((current) => ({ ...current, raw }));
  }

  async function submit() {
    if (!state.dataset) return;
    setIsUploading(true);
    try {
      onUploaded(await uploadDataset(state.dataset, state.key));
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-layout">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Upload JSON</h2>
            <p>Public datasets appear in the gallery after validation.</p>
          </div>
          <FileJson size={28} />
        </div>
        <label className="field">
          <span>Shared upload key</span>
          <input value={state.key} onChange={(event) => setState({ ...state, key: event.target.value })} type="password" />
        </label>
        <label className="file-picker">
          <Upload size={18} />
          Choose .json file
          <input type="file" accept="application/json,.json" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
        <textarea
          value={state.raw}
          spellCheck={false}
          onChange={(event) => setState({ ...state, raw: event.target.value })}
          aria-label="Dataset JSON"
        />
      </div>

      <div className="panel">
        <h2>Preview</h2>
        {state.errors.length > 0 ? (
          <div className="validation-list" role="status">
            {state.errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : state.dataset ? (
          <div className="preview-box">
            <strong>{state.dataset.title}</strong>
            <p>{state.dataset.description || 'No description supplied.'}</p>
            <div className="tag-row">
              {state.dataset.tags?.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <p>{state.dataset.items.length} quiz items ready.</p>
            <button className="primary-button" disabled={!state.key || isUploading} onClick={submit}>
              {isUploading ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
              Publish public set
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function QuizRunner({
  dataset,
  onBack,
  onScore
}: {
  dataset: PublicDataset;
  onBack: () => void;
  onScore: (score: ScoreRecord) => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const item = dataset.items[index];
  const progress = Math.round(((index + (completed ? 1 : 0)) / dataset.items.length) * 100);

  function check(points: number) {
    setPendingPoints(points);
    setRevealed(true);
  }

  function next() {
    const nextScore = score + pendingPoints;
    setScore(nextScore);

    if (index < dataset.items.length - 1) {
      setIndex(index + 1);
      setSelected('');
      setTyped('');
      setRevealed(false);
      setPendingPoints(0);
      return;
    }

    setCompleted(true);
    onScore({
      datasetId: dataset.id,
      title: dataset.title,
      score: nextScore,
      total: dataset.items.length,
      completedAt: new Date().toISOString()
    });
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setSelected('');
    setTyped('');
    setRevealed(false);
    setPendingPoints(0);
    setCompleted(false);
  }

  if (completed) {
    return (
      <section className="panel result-panel">
        <Sparkles size={44} />
        <h2>{score}/{dataset.items.length}</h2>
        <p>{score === dataset.items.length ? 'Perfect run.' : 'Round complete. Run it again to push the score higher.'}</p>
        <div className="button-row">
          <button className="primary-button" onClick={restart}><RotateCcw size={17} /> Replay</button>
          <button className="ghost-button" onClick={onBack}>Gallery</button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-layout">
      <div className="quiz-header">
        <button className="ghost-button" onClick={onBack}>Gallery</button>
        <div>
          <strong>{dataset.title}</strong>
          <span>{index + 1} of {dataset.items.length}</span>
        </div>
        <strong>{score + (revealed ? pendingPoints : 0)} pts</strong>
      </div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <QuizCard
        item={item}
        selected={selected}
        typed={typed}
        revealed={revealed}
        onSelect={setSelected}
        onTyped={setTyped}
        onCheck={check}
        onOverride={() => setPendingPoints(1)}
        onNext={next}
      />
    </section>
  );
}

function QuizCard({
  item,
  selected,
  typed,
  revealed,
  onSelect,
  onTyped,
  onCheck,
  onOverride,
  onNext
}: {
  item: QuizItem;
  selected: string;
  typed: string;
  revealed: boolean;
  onSelect: (value: string) => void;
  onTyped: (value: string) => void;
  onCheck: (points: number) => void;
  onOverride: () => void;
  onNext: () => void;
}) {
  const similarity = item.type === 'free-write' ? answerSimilarity(typed, item.answer) : 0;

  return (
    <article className="quiz-card">
      <span className="type-pill">{item.type.replace('-', ' ')}</span>
      <h2>{item.prompt}</h2>

      {item.type === 'flashcard' && (
        <div className="answer-zone">
          {revealed ? <p className="answer-text">{item.answer}</p> : <p>Think it through, then reveal the answer.</p>}
          {revealed ? (
            <button className="primary-button" onClick={onNext}>Next</button>
          ) : (
            <button className="primary-button" onClick={() => onCheck(1)}>Reveal</button>
          )}
        </div>
      )}

      {item.type === 'multiple-choice' && (
        <div className="option-grid">
          {item.options.map((option) => {
            const isCorrect = option === item.answer;
            const isPicked = selected === option;
            const className = revealed && isCorrect ? 'option correct' : revealed && isPicked ? 'option wrong' : 'option';
            return (
              <button
                className={className}
                disabled={revealed}
                key={option}
                onClick={() => {
                  onSelect(option);
                  onCheck(isCorrect ? 1 : 0);
                }}
              >
                {revealed && isCorrect ? <Check size={17} /> : revealed && isPicked ? <X size={17} /> : null}
                {option}
              </button>
            );
          })}
          {revealed && <button className="primary-button" onClick={onNext}>Next</button>}
        </div>
      )}

      {item.type === 'free-write' && (
        <div className="answer-zone">
          <input value={typed} disabled={revealed} onChange={(event) => onTyped(event.target.value)} placeholder="Type your answer" />
          {revealed ? (
            <>
              <p className={isFreeWritePass(typed, item.answer) ? 'feedback pass' : 'feedback fail'}>
                {Math.round(similarity * 100)}% match. Expected: <strong>{item.answer}</strong>
              </p>
              {!isFreeWritePass(typed, item.answer) && (
                <button className="ghost-button" onClick={onOverride}>Mark correct</button>
              )}
              <button className="primary-button" onClick={onNext}>Next</button>
            </>
          ) : (
            <button className="primary-button" disabled={!typed.trim()} onClick={() => onCheck(isFreeWritePass(typed, item.answer) ? 1 : 0)}>
              Check answer
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function parseDataset(raw: string): { dataset: DatasetInput | null; errors: string[] } {
  try {
    const parsed = JSON.parse(raw);
    const result = validateDataset(parsed);
    return result.ok ? { dataset: result.value, errors: [] } : { dataset: null, errors: result.errors };
  } catch {
    return { dataset: null, errors: ['JSON could not be parsed.'] };
  }
}

function ToastHost({
  toasts,
  onDismiss
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toast-region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast ${toast.kind}`} key={toast.id}>
          <span>{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

async function copyShareLink(slug: string, onToast: (kind: ToastKind, message: string) => void) {
  const url = `${window.location.origin}/quiz/${slug}`;
  try {
    await navigator.clipboard?.writeText(url);
    onToast('success', 'Share link copied.');
  } catch {
    onToast('error', 'Could not copy the share link.');
  }
}
