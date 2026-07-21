import { Loader2, Target } from 'lucide-react';
import type { PublicDataset } from '../../shared/quiz';
import { ExamPage } from './ExamPage';
import { QuizPlayPage } from './QuizPlayPage';
import type { AttemptRecord } from '../storage';
import { buildCertificationPool, createStudyDataset } from '../study/pool';
import { getActiveStudyDrill } from '../study/storage';
import type { Navigate } from '../types';

export function StudyDrillPlayPage({ examCode, datasets, isLoading, navigate, onAttempt }: {
  examCode: string;
  datasets: PublicDataset[];
  isLoading: boolean;
  navigate: Navigate;
  onAttempt: (attempt: AttemptRecord) => void;
}) {
  const config = getActiveStudyDrill(examCode);
  if (isLoading) return <section className="study-loading page"><Loader2 className="spin" size={28} /> Loading your drill…</section>;
  if (!config) return <section className="result-empty"><Target size={38} /><h1>No drill selected</h1><p>Choose a question pool and session length first.</p><button className="primary-button" onClick={() => navigate(`/study/${examCode.toLowerCase()}/drill`)}>Build a drill</button></section>;
  const dataset = createStudyDataset(examCode, buildCertificationPool(examCode, datasets), config);
  if (!dataset.items.length) return <section className="result-empty"><Target size={38} /><h1>Questions unavailable</h1><p>The selected source questions could not be loaded.</p><button className="primary-button" onClick={() => navigate(`/study/${examCode.toLowerCase()}/drill`)}>Build another drill</button></section>;
  if (config.mode === 'domain-boss' || config.mode === 'final-boss') {
    return <ExamPage dataset={dataset} navigate={navigate} onAttempt={onAttempt} studyExamCode={examCode.toUpperCase()} studyConfig={config} />;
  }
  return <QuizPlayPage dataset={dataset} navigate={navigate} onAttempt={onAttempt} studyExamCode={examCode.toUpperCase()} />;
}
