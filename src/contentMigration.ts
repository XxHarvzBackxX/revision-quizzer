import { resetStoredQuizProgress } from './storage';
import { resetStudyContentProgress } from './study/storage';

export const CURATED_CONTENT_REVISION = '2026-realistic-v1';
export const CURATED_CONTENT_REVISION_KEY = 'quiz-arcade:curated-content-revision';

const CURATED_DATASET_IDS = new Set([
  'builtin-ai901-paper-1', 'builtin-ai901-paper-2', 'builtin-ai901-paper-3',
  'builtin-az900-paper-1', 'builtin-az900-paper-2', 'builtin-az900-paper-3'
]);
const EXAM_CODES = new Set(['AI-901', 'AZ-900']);
const STUDY_DATASET_PREFIXES = ['study-ai901-', 'study-az900-'];

export function migrateCuratedContentRevision(): boolean {
  try {
    if (localStorage.getItem(CURATED_CONTENT_REVISION_KEY) === CURATED_CONTENT_REVISION) return false;
    resetStoredQuizProgress(CURATED_DATASET_IDS, STUDY_DATASET_PREFIXES);
    resetStudyContentProgress(CURATED_DATASET_IDS, EXAM_CODES);
    localStorage.setItem(CURATED_CONTENT_REVISION_KEY, CURATED_CONTENT_REVISION);
    return true;
  } catch {
    return false;
  }
}
