import { Loader2, Target } from 'lucide-react';
import type { PublicDataset } from '../../shared/quiz';
import { buildReviewPool, createReviewDataset } from '../review/pool';
import { getReviewState } from '../review/storage';
import type { AttemptRecord } from '../storage';
import type { Navigate } from '../types';
import { ResultPage } from './ResultPage';

export function MistakeReviewResultPage({ datasets, attempt, isLoading, navigate }: {
  datasets: PublicDataset[];
  attempt?: AttemptRecord;
  isLoading: boolean;
  navigate: Navigate;
}) {
  if (isLoading) return <section className="study-loading page"><Loader2 className="spin" size={28} /> Loading your review results…</section>;
  if (!attempt) return <section className="result-empty"><Target size={38} /><h1>Review result unavailable</h1><p>This result may have been cleared from this browser.</p><button className="primary-button" onClick={() => navigate('/study/mistakes')}>Mistake notebook</button></section>;
  const state = getReviewState();
  const questionKeys = attempt.answers.flatMap((answer) => {
    const datasetId = answer.sourceDatasetId ?? attempt.datasetId;
    const questionId = answer.sourceQuestionId ?? answer.questionId;
    return questionId ? [`${datasetId}/${questionId}`] : [];
  });
  const session = { id: attempt.datasetId, questionKeys, createdAt: attempt.startedAt };
  const dataset = createReviewDataset(session, buildReviewPool(Object.values(state.records), datasets));
  return <ResultPage dataset={dataset} attempt={attempt} navigate={navigate} mistakeReview />;
}
