import { Loader2, Target } from 'lucide-react';
import type { PublicDataset } from '../../shared/quiz';
import { buildReviewPool, createReviewDataset } from '../review/pool';
import { getReviewState } from '../review/storage';
import type { AttemptRecord } from '../storage';
import type { Navigate } from '../types';
import { QuizPlayPage } from './QuizPlayPage';

export function MistakeReviewPlayPage({ datasets, isLoading, navigate, onAttempt }: {
  datasets: PublicDataset[];
  isLoading: boolean;
  navigate: Navigate;
  onAttempt: (attempt: AttemptRecord) => void;
}) {
  const state = getReviewState();
  const session = state.activeSession;
  if (isLoading) return <section className="study-loading page"><Loader2 className="spin" size={28} /> Loading your review…</section>;
  if (!session) return <section className="result-empty"><Target size={38} /><h1>No review selected</h1><p>Choose the due questions you want to revisit first.</p><button className="primary-button" onClick={() => navigate('/study/mistakes')}>Open mistake notebook</button></section>;
  const dataset = createReviewDataset(session, buildReviewPool(Object.values(state.records), datasets));
  if (!dataset.items.length) return <section className="result-empty"><Target size={38} /><h1>Questions unavailable</h1><p>The selected source questions could not be loaded.</p><button className="primary-button" onClick={() => navigate('/study/mistakes')}>Back to notebook</button></section>;
  return <QuizPlayPage dataset={dataset} navigate={navigate} onAttempt={onAttempt} mistakeReview />;
}

