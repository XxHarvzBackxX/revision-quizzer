import { Loader2, Target } from 'lucide-react';
import type { PublicDataset } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import { buildCertificationPool, createStudyDataset } from '../study/pool';
import type { StudyDrillConfig } from '../study/types';
import type { Navigate } from '../types';
import { ResultPage } from './ResultPage';

export function StudyDrillResultPage({ examCode, datasets, attempt, isLoading, navigate }: {
  examCode: string;
  datasets: PublicDataset[];
  attempt?: AttemptRecord;
  isLoading: boolean;
  navigate: Navigate;
}) {
  if (isLoading) return <section className="study-loading page"><Loader2 className="spin" size={28} /> Loading your results…</section>;
  if (!attempt) return <section className="result-empty"><Target size={38} /><h1>Drill result unavailable</h1><p>This result may have been cleared from this browser.</p><button className="primary-button" onClick={() => navigate(`/study/${examCode.toLowerCase()}`)}>Study plan</button></section>;
  const questionKeys = attempt.answers.flatMap((answer) => {
    const datasetId = answer.sourceDatasetId ?? attempt.datasetId;
    const questionId = answer.sourceQuestionId ?? answer.questionId;
    return questionId ? [`${datasetId}/${questionId}`] : [];
  });
  const config: StudyDrillConfig = { examCode: examCode.toUpperCase(), filter: 'all', count: questionKeys.length, questionKeys, seed: attempt.id, createdAt: attempt.startedAt };
  const dataset = createStudyDataset(examCode, buildCertificationPool(examCode, datasets), config);
  return <ResultPage dataset={dataset} attempt={attempt} navigate={navigate} studyExamCode={examCode.toUpperCase()} />;
}
