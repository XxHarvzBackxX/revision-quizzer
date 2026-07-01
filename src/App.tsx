import {
  Check,
  Copy,
  FileJson,
  Gamepad2,
  KeyRound,
  Library,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Upload,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  deleteAdminDataset,
  fetchAdminConfig,
  fetchAdminDatasets,
  fetchDataset,
  fetchDatasets,
  loginAdmin,
  updateAdminConfig,
  updateAdminDataset,
  uploadDataset
} from './api';
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

type View = 'home' | 'gallery' | 'admin' | 'quiz-menu' | 'quiz-play';
type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };
type UploadState = { raw: string; dataset: DatasetInput | null; errors: string[] };

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
  const [view, setView] = useState<View>(window.location.pathname === '/admin' ? 'admin' : 'home');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState<PublicDataset | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>(() => getScores());
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    void loadGallery(false);
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/quiz\/([^/]+)$/);
    if (match?.[1]) {
      void openDataset(decodeURIComponent(match[1]));
    }
  }, []);

  async function loadGallery(showToast = true) {
    setIsLoading(true);
    try {
      setDatasets(await fetchDatasets());
      if (showToast) notify('success', 'Gallery refreshed.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not load datasets.');
    } finally {
      setIsLoading(false);
    }
  }

  async function openDataset(id: string) {
    setIsLoading(true);
    try {
      setActiveDataset(await fetchDataset(id));
      setView('quiz-menu');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not load dataset.');
    } finally {
      setIsLoading(false);
    }
  }

  function notify(kind: ToastKind, message: string) {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), kind, message }]);
  }

  function handleScore(score: ScoreRecord) {
    saveScore(score);
    setScores(getScores());
  }

  return (
    <main className={`app-shell view-${view}`}>
      <header className="topbar">
        <button className="brand-button" onClick={() => setView('home')} aria-label="Open home">
          <span className="brand-mark"><Gamepad2 size={24} /></span>
          <span>
            <strong>Quiz Arcade</strong>
            <small>Revision rounds with a pulse</small>
          </span>
        </button>
        <nav className="nav-actions">
          <button className={view === 'home' ? 'nav-button active' : 'nav-button'} onClick={() => setView('home')}>Home</button>
          <button className={view === 'gallery' ? 'nav-button active' : 'nav-button'} onClick={() => setView('gallery')}>
            <Library size={17} /> Gallery
          </button>
        </nav>
      </header>

      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      {view === 'home' && (
        <Home
          datasets={datasets}
          scores={scores}
          isLoading={isLoading}
          onGallery={() => setView('gallery')}
          onStart={openDataset}
        />
      )}

      {view === 'gallery' && (
        <Gallery
          datasets={datasets}
          isLoading={isLoading}
          scores={scores}
          onRefresh={() => loadGallery()}
          onStart={openDataset}
          onToast={notify}
        />
      )}

      {view === 'admin' && (
        <AdminPanel
          onToast={notify}
          onUploaded={(dataset) => {
            const { items: _items, ...summary } = dataset;
            setDatasets((current) => [summary, ...current]);
            setActiveDataset(dataset);
            setView('quiz-menu');
            notify('success', `"${dataset.title}" is live in the public gallery.`);
          }}
        />
      )}

      {view === 'quiz-menu' && activeDataset && (
        <QuizMenu
          dataset={activeDataset}
          lastScore={scores.find((score) => score.datasetId === activeDataset.id)}
          onBack={() => setView('gallery')}
          onPlay={() => setView('quiz-play')}
          onToast={notify}
        />
      )}

      {view === 'quiz-play' && activeDataset && (
        <QuizRunner
          dataset={activeDataset}
          onBack={() => setView('quiz-menu')}
          onScore={handleScore}
          onToast={notify}
        />
      )}
    </main>
  );
}

function Home({
  datasets,
  scores,
  isLoading,
  onGallery,
  onStart
}: {
  datasets: DatasetSummary[];
  scores: ScoreRecord[];
  isLoading: boolean;
  onGallery: () => void;
  onStart: (id: string) => void;
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
            <button className="primary-button big" onClick={onGallery}><Play size={19} /> Browse quizzes</button>
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
            <button className="ghost-button" onClick={onGallery}>View all</button>
          </div>
          <div className="mini-set-list">
            {featured.length === 0 ? (
              <div className="empty-state">No public sets loaded yet.</div>
            ) : featured.map((dataset) => (
              <button className="mini-set" key={dataset.id} onClick={() => onStart(dataset.slug)}>
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

function Gallery({
  datasets,
  isLoading,
  scores,
  onRefresh,
  onStart,
  onToast
}: {
  datasets: DatasetSummary[];
  isLoading: boolean;
  scores: ScoreRecord[];
  onRefresh: () => void;
  onStart: (id: string) => void;
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
                    <button className="primary-button" onClick={() => onStart(dataset.slug)}>Open</button>
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

function AdminPanel({
  onUploaded,
  onToast
}: {
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      await loginAdmin(password);
      setAdminPassword(password);
      setPassword('');
      onToast('success', 'Admin unlocked.');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not log in.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (!adminPassword) {
    return (
      <section className="admin-login">
        <form className="login-panel" onSubmit={submitLogin}>
          <div className="lock-badge"><Shield size={32} /></div>
          <h1>Admin access</h1>
          <p>This page is intentionally hidden from navigation.</p>
          <label className="field">
            <span>Admin password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoFocus />
          </label>
          <button className="primary-button big" disabled={!password || isLoggingIn}>
            {isLoggingIn ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
            Unlock uploader
          </button>
        </form>
      </section>
    );
  }

  return <AdminConsole adminPassword={adminPassword} onUploaded={onUploaded} onToast={onToast} />;
}

function AdminConsole({
  adminPassword,
  onUploaded,
  onToast
}: {
  adminPassword: string;
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [tab, setTab] = useState<'upload' | 'datasets'>('upload');
  const [adminDatasets, setAdminDatasets] = useState<PublicDataset[]>([]);
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  useEffect(() => {
    void refreshAdmin();
  }, []);

  async function refreshAdmin() {
    setIsLoadingAdmin(true);
    try {
      const [config, datasets] = await Promise.all([
        fetchAdminConfig(adminPassword),
        fetchAdminDatasets(adminPassword)
      ]);
      setModerationEnabled(config.moderationEnabled);
      setAdminDatasets(datasets);
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not load admin data.');
    } finally {
      setIsLoadingAdmin(false);
    }
  }

  async function toggleModeration(value: boolean) {
    setModerationEnabled(value);
    try {
      const config = await updateAdminConfig({ moderationEnabled: value }, adminPassword);
      setModerationEnabled(config.moderationEnabled);
      onToast('success', config.moderationEnabled ? 'Approval gate enabled.' : 'Approval gate disabled.');
    } catch (error) {
      setModerationEnabled(!value);
      onToast('error', error instanceof Error ? error.message : 'Could not update moderation setting.');
    }
  }

  return (
    <section className="admin-page">
      <div className="section-title admin-title">
        <p className="eyebrow"><Lock size={16} /> admin console</p>
        <h1>Control room</h1>
      </div>
      <div className="admin-toolbar">
        <div className="segmented-control">
          <button className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')}>Upload</button>
          <button className={tab === 'datasets' ? 'active' : ''} onClick={() => setTab('datasets')}>Datasets</button>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={moderationEnabled} onChange={(event) => toggleModeration(event.target.checked)} />
          <span>Require admin approval for upload-key submissions</span>
        </label>
        <button className="ghost-button" onClick={refreshAdmin}>
          {isLoadingAdmin ? <Loader2 className="spin" size={16} /> : <RotateCcw size={16} />}
          Refresh
        </button>
      </div>

      {tab === 'upload' ? (
        <UploadPanel adminPassword={adminPassword} onUploaded={(dataset) => {
          onUploaded(dataset);
          void refreshAdmin();
        }} onToast={onToast} />
      ) : (
        <AdminDatasetManager
          adminPassword={adminPassword}
          datasets={adminDatasets}
          isLoading={isLoadingAdmin}
          onChanged={refreshAdmin}
          onToast={onToast}
        />
      )}
    </section>
  );
}

function UploadPanel({
  adminPassword,
  onUploaded,
  onToast
}: {
  adminPassword: string;
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [state, setState] = useState<UploadState>({ raw: sampleDataset, dataset: null, errors: [] });
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
      onUploaded(await uploadDataset(state.dataset, { adminPassword }));
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
      <div className="upload-layout">
        <div className="upload-editor">
          <label className="file-picker">
            <Upload size={18} />
            Choose .json file
            <input type="file" accept="application/json,.json" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
          <textarea value={state.raw} spellCheck={false} onChange={(event) => setState({ ...state, raw: event.target.value })} aria-label="Dataset JSON" />
        </div>
        <div className="upload-preview">
          <h2>Preview</h2>
          {state.errors.length > 0 ? (
            <div className="validation-list" role="status">{state.errors.map((error) => <p key={error}>{error}</p>)}</div>
          ) : state.dataset ? (
            <div className="preview-box">
              <strong>{state.dataset.title}</strong>
              <p>{state.dataset.description || 'No description supplied.'}</p>
              <div className="tag-row">{state.dataset.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <p>{state.dataset.items.length} quiz items ready.</p>
              <button className="primary-button" disabled={isUploading} onClick={submit}>
                {isUploading ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
                Publish public set
              </button>
            </div>
          ) : null}
        </div>
      </div>
  );
}

function AdminDatasetManager({
  adminPassword,
  datasets,
  isLoading,
  onChanged,
  onToast
}: {
  adminPassword: string;
  datasets: PublicDataset[];
  isLoading: boolean;
  onChanged: () => Promise<void>;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending'>('approved');
  const [isSaving, setIsSaving] = useState(false);
  const selected = datasets.find((dataset) => dataset.id === selectedId) ?? datasets[0];
  const parsed = useMemo(() => raw ? parseDataset(raw) : { dataset: null, errors: [] }, [raw]);

  useEffect(() => {
    if (!selected) {
      setSelectedId('');
      setRaw('');
      return;
    }
    if (!selectedId || selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
    setRaw(JSON.stringify({
      title: selected.title,
      description: selected.description,
      tags: selected.tags,
      items: selected.items
    }, null, 2));
    setStatus(selected.status ?? 'approved');
  }, [selected?.id]);

  async function save() {
    if (!selected || !parsed.dataset) return;
    setIsSaving(true);
    try {
      await updateAdminDataset(selected.id, parsed.dataset, status, adminPassword);
      onToast('success', `"${parsed.dataset.title}" saved.`);
      await onChanged();
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not save dataset.');
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    const confirmed = window.confirm(`Delete "${selected.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await deleteAdminDataset(selected.id, adminPassword);
      onToast('success', 'Dataset deleted.');
      setSelectedId('');
      await onChanged();
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not delete dataset.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="empty-state admin-empty">Loading admin datasets...</div>;
  }

  if (datasets.length === 0) {
    return <div className="empty-state admin-empty">No datasets to manage yet.</div>;
  }

  return (
    <div className="manager-layout">
      <aside className="dataset-sidebar">
        {datasets.map((dataset) => (
          <button className={dataset.id === selected?.id ? 'manager-item active' : 'manager-item'} key={dataset.id} onClick={() => setSelectedId(dataset.id)}>
            <span>{dataset.title}</span>
            <strong>{dataset.status ?? 'approved'}</strong>
          </button>
        ))}
      </aside>
      <div className="manager-editor">
        <div className="manager-heading">
          <div>
            <h2>{selected?.title}</h2>
            <p>Edit the dataset JSON, then save it as approved or pending.</p>
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'approved' | 'pending')}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <textarea value={raw} spellCheck={false} onChange={(event) => setRaw(event.target.value)} aria-label="Editable dataset JSON" />
        {parsed.errors.length > 0 && (
          <div className="validation-list" role="status">{parsed.errors.map((error) => <p key={error}>{error}</p>)}</div>
        )}
        <div className="button-row manager-actions">
          <button className="danger-button" disabled={isSaving} onClick={remove}>Delete</button>
          <button className="primary-button" disabled={isSaving || !parsed.dataset || parsed.errors.length > 0} onClick={save}>
            {isSaving ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizMenu({
  dataset,
  lastScore,
  onBack,
  onPlay,
  onToast
}: {
  dataset: PublicDataset;
  lastScore?: ScoreRecord;
  onBack: () => void;
  onPlay: () => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const counts = dataset.items.reduce<Record<string, number>>((current, item) => {
    current[item.type] = (current[item.type] ?? 0) + 1;
    return current;
  }, {});

  return (
    <section className="quiz-menu">
      <button className="ghost-button back-button" onClick={onBack}>Gallery</button>
      <div className="marquee-panel">
        <p className="eyebrow"><Zap size={16} /> now loading</p>
        <h1>{dataset.title}</h1>
        <p>{dataset.description || 'No description supplied.'}</p>
        <div className="tag-row">{(dataset.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="menu-actions">
          <button className="primary-button big" onClick={onPlay}><Play size={19} /> Start round</button>
          <button className="ghost-button" onClick={() => copyShareLink(dataset.slug, onToast)}><Copy size={16} /> Copy link</button>
        </div>
      </div>
      <div className="quiz-menu-stats">
        <StatTile label="Questions" value={dataset.itemCount.toString()} />
        <StatTile label="Multiple choice" value={(counts['multiple-choice'] ?? 0).toString()} />
        <StatTile label="Free write" value={(counts['free-write'] ?? 0).toString()} />
        <StatTile label="Flashcards" value={(counts.flashcard ?? 0).toString()} />
        <div className="last-score-card">
          <Trophy size={26} />
          <span>Last score</span>
          <strong>{lastScore ? `${lastScore.score}/${lastScore.total}` : 'No run yet'}</strong>
        </div>
      </div>
    </section>
  );
}

function QuizRunner({
  dataset,
  onBack,
  onScore,
  onToast
}: {
  dataset: PublicDataset;
  onBack: () => void;
  onScore: (score: ScoreRecord) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [effect, setEffect] = useState<'correct' | 'wrong' | ''>('');
  const item = dataset.items[index];
  const progress = Math.round(((index + (completed ? 1 : 0)) / dataset.items.length) * 100);
  const streakLabel = pendingPoints && revealed ? 'Hit!' : score > 0 ? `${score} banked` : 'Warm up';

  function check(points: number) {
    setPendingPoints(points);
    setRevealed(true);
    setEffect(points ? 'correct' : 'wrong');
    if (points) onToast('success', '+1 point');
  }

  function next() {
    const nextScore = score + pendingPoints;
    setScore(nextScore);
    setEffect('');

    if (index < dataset.items.length - 1) {
      setIndex(index + 1);
      setSelected('');
      setTyped('');
      setRevealed(false);
      setPendingPoints(0);
      return;
    }

    setCompleted(true);
    onScore({ datasetId: dataset.id, title: dataset.title, score: nextScore, total: dataset.items.length, completedAt: new Date().toISOString() });
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setSelected('');
    setTyped('');
    setRevealed(false);
    setPendingPoints(0);
    setCompleted(false);
    setEffect('');
  }

  if (completed) {
    return <ResultPanel dataset={dataset} score={score} onBack={onBack} onRestart={restart} />;
  }

  return (
    <section className={`quiz-stage ${effect ? `effect-${effect}` : ''}`}>
      {effect === 'correct' && <div className="confetti-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>}
      <div className="quiz-hud">
        <button className="ghost-button" onClick={onBack}>Menu</button>
        <div className="hud-center">
          <strong>{dataset.title}</strong>
          <span>{index + 1} of {dataset.items.length}</span>
        </div>
        <div className="score-chip"><Zap size={16} /> {score + (revealed ? pendingPoints : 0)} pts</div>
      </div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="streak-ribbon">{streakLabel}</div>
      <QuizCard
        item={item}
        selected={selected}
        typed={typed}
        revealed={revealed}
        onSelect={setSelected}
        onTyped={setTyped}
        onCheck={check}
        onOverride={() => {
          setPendingPoints(1);
          setEffect('correct');
          onToast('info', 'Manual override marked correct.');
        }}
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
          {revealed ? <p className="answer-text">{item.answer}</p> : <p>Lock in your answer mentally, then reveal it.</p>}
          {revealed ? <button className="primary-button" onClick={onNext}>Next</button> : <button className="primary-button" onClick={() => onCheck(1)}>Reveal</button>}
        </div>
      )}
      {item.type === 'multiple-choice' && (
        <div className="option-grid">
          {item.options.map((option) => {
            const isCorrect = option === item.answer;
            const isPicked = selected === option;
            const className = revealed && isCorrect ? 'option correct' : revealed && isPicked ? 'option wrong' : 'option';
            return (
              <button className={className} disabled={revealed} key={option} onClick={() => { onSelect(option); onCheck(isCorrect ? 1 : 0); }}>
                {revealed && isCorrect ? <Check size={17} /> : revealed && isPicked ? <X size={17} /> : null}
                {option}
              </button>
            );
          })}
          {revealed && <button className="primary-button next-button" onClick={onNext}>Next</button>}
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
              {!isFreeWritePass(typed, item.answer) && <button className="ghost-button" onClick={onOverride}>Mark correct</button>}
              <button className="primary-button" onClick={onNext}>Next</button>
            </>
          ) : (
            <button className="primary-button" disabled={!typed.trim()} onClick={() => onCheck(isFreeWritePass(typed, item.answer) ? 1 : 0)}>Check answer</button>
          )}
        </div>
      )}
    </article>
  );
}

function ResultPanel({ dataset, score, onBack, onRestart }: { dataset: PublicDataset; score: number; onBack: () => void; onRestart: () => void }) {
  const percent = Math.round((score / dataset.items.length) * 100);
  return (
    <section className="result-panel">
      <div className="result-medal"><Trophy size={54} /></div>
      <p className="eyebrow"><Sparkles size={16} /> round complete</p>
      <h1>{percent}%</h1>
      <p>{score}/{dataset.items.length} correct on {dataset.title}</p>
      <div className="button-row">
        <button className="primary-button big" onClick={onRestart}><RotateCcw size={18} /> Replay</button>
        <button className="ghost-button" onClick={onBack}>Quiz menu</button>
      </div>
    </section>
  );
}

function RecentScores({ scores }: { scores: ScoreRecord[] }) {
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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function ToastHost({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast ${toast.kind}`} key={toast.id}>
          <span>{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><X size={16} /></button>
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
