import { useEffect, useState } from 'react';
import type { DatasetSummary, PublicConfig, PublicDataset } from '../shared/quiz';
import { fetchDataset, fetchDatasets, fetchPublicConfig } from './api';
import { Topbar } from './components/Topbar';
import { ToastHost } from './components/ToastHost';
import { AdminPage } from './pages/AdminPage';
import { GalleryPage } from './pages/GalleryPage';
import { HomePage } from './pages/HomePage';
import { PublicUploadPage } from './pages/PublicUploadPage';
import { QuizMenuPage } from './pages/QuizMenuPage';
import { QuizPlayPage } from './pages/QuizPlayPage';
import { parseRoute, routeClass } from './routing';
import { getScores, saveScore, type ScoreRecord } from './storage';
import type { AppRoute, Toast, ToastKind } from './types';

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState<PublicDataset | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>(() => getScores());
  const [publicConfig, setPublicConfig] = useState<PublicConfig>({ uploadKeyRequired: true });
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    void loadGallery(false);
    void loadPublicConfig();

    const onPopState = () => setRoute(parseRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (route.name === 'quiz-menu' || route.name === 'quiz-play') {
      void loadActiveDataset(route.slug);
    }
  }, [route.path]);

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setRoute(parseRoute(path));
  }

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

  async function loadPublicConfig() {
    try {
      setPublicConfig(await fetchPublicConfig());
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not load upload settings.');
    }
  }

  async function loadActiveDataset(slug: string) {
    setIsLoading(true);
    try {
      setActiveDataset(await fetchDataset(slug));
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not load dataset.');
      navigate('/gallery');
    } finally {
      setIsLoading(false);
    }
  }

  function notify(kind: ToastKind, message: string) {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), kind, message, createdAt: Date.now() }]);
  }

  function handleScore(score: ScoreRecord) {
    saveScore(score);
    setScores(getScores());
  }

  function handleApprovedUpload(dataset: PublicDataset) {
    const { items: _items, ...summary } = dataset;
    setDatasets((current) => [summary, ...current]);
    setActiveDataset(dataset);
    navigate(`/quiz/${dataset.slug}`);
    notify('success', `"${dataset.title}" is live in the public gallery.`);
  }

  return (
    <main className={`app-shell view-${routeClass(route)}`}>
      <Topbar route={route} navigate={navigate} />
      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      {route.name === 'home' && <HomePage datasets={datasets} scores={scores} isLoading={isLoading} navigate={navigate} />}

      {route.name === 'gallery' && (
        <GalleryPage
          datasets={datasets}
          isLoading={isLoading}
          scores={scores}
          onRefresh={() => loadGallery()}
          navigate={navigate}
          onToast={notify}
        />
      )}

      {route.name === 'upload' && (
        <PublicUploadPage
          config={publicConfig}
          onToast={notify}
          onUploaded={(dataset) => {
            if (dataset.status === 'pending') {
              notify('info', `"${dataset.title}" was submitted and is waiting for admin approval.`);
              navigate('/gallery');
              return;
            }
            handleApprovedUpload(dataset);
          }}
        />
      )}

      {route.name === 'admin' && <AdminPage onToast={notify} onUploaded={handleApprovedUpload} />}

      {route.name === 'quiz-menu' && activeDataset && (
        <QuizMenuPage
          dataset={activeDataset}
          lastScore={scores.find((score) => score.datasetId === activeDataset.id)}
          navigate={navigate}
          onToast={notify}
        />
      )}

      {route.name === 'quiz-play' && activeDataset && (
        <QuizPlayPage dataset={activeDataset} navigate={navigate} onScore={handleScore} onToast={notify} />
      )}
    </main>
  );
}
