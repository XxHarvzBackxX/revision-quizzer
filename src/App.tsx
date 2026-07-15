import { useEffect, useState } from 'react';
import type { DatasetSummary, PublicConfig, PublicDataset } from '../shared/quiz';
import { fetchDataset, fetchDatasets, fetchPublicConfig } from './api';
import { Topbar } from './components/Topbar';
import { ToastHost } from './components/ToastHost';
import { AdminPage } from './pages/AdminPage';
import { GalleryPage } from './pages/GalleryPage';
import { HomePage } from './pages/HomePage';
import { PublicUploadPage } from './pages/PublicUploadPage';
import { ExamPage } from './pages/ExamPage';
import { QuizMenuPage } from './pages/QuizMenuPage';
import { QuizPlayPage } from './pages/QuizPlayPage';
import { ResultPage } from './pages/ResultPage';
import { RevisionCoursePage } from './pages/RevisionCoursePage';
import { RevisionReaderPage } from './pages/RevisionReaderPage';
import { RevisionWikiIndexPage } from './pages/RevisionWikiIndexPage';
import { parseRoute, routeClass } from './routing';
import { getActiveExamSessions, getAttempts, hasResumableExam, saveAttempt, type AttemptRecord } from './storage';
import type { AppRoute, Toast, ToastKind } from './types';

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState<PublicDataset | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => getAttempts());
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
    if (route.name === 'quiz-menu' || route.name === 'quiz-practice' || route.name === 'quiz-exam' || route.name === 'quiz-result') {
      void loadActiveDataset(route.slug);
    }
  }, [route.path]);

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setRoute(parseRoute(new URL(path, window.location.origin).pathname));
    window.scrollTo({ top: 0, behavior: 'auto' });
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
    if (activeDataset?.slug === slug) return;
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

  function handleAttempt(attempt: AttemptRecord) {
    setAttempts(saveAttempt(attempt));
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
      {route.name !== 'quiz-exam' && route.name !== 'quiz-practice' && <Topbar route={route} navigate={navigate} />}
      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      {route.name === 'home' && <HomePage datasets={datasets} attempts={attempts} activeSessions={getActiveExamSessions()} isLoading={isLoading} navigate={navigate} />}

      {route.name === 'gallery' && (
        <GalleryPage
          datasets={datasets}
          isLoading={isLoading}
          attempts={attempts}
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

      {route.name === 'wiki' && <RevisionWikiIndexPage navigate={navigate} onToast={notify} />}

      {route.name === 'wiki-course' && <RevisionCoursePage examCode={route.examCode} navigate={navigate} />}

      {route.name === 'wiki-page' && <RevisionReaderPage examCode={route.examCode} pageSlug={route.pageSlug} navigate={navigate} onToast={notify} />}

      {route.name === 'quiz-menu' && activeDataset && (
        <QuizMenuPage
          dataset={activeDataset}
          attempts={attempts}
          canResume={hasResumableExam(activeDataset.id)}
          navigate={navigate}
          onToast={notify}
        />
      )}

      {route.name === 'quiz-practice' && activeDataset && (
        <QuizPlayPage dataset={activeDataset} navigate={navigate} onAttempt={handleAttempt} />
      )}

      {route.name === 'quiz-exam' && activeDataset && (
        <ExamPage dataset={activeDataset} navigate={navigate} onAttempt={handleAttempt} />
      )}

      {route.name === 'quiz-result' && activeDataset && (
        <ResultPage dataset={activeDataset} attempt={attempts.find((attempt) => attempt.id === route.attemptId)} navigate={navigate} />
      )}
    </main>
  );
}
