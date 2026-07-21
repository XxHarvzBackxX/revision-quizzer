export type QuizMode = 'exam' | 'practice';

export type StudyConfidence = 'sure' | 'unsure' | 'guess';

export type AttemptAnswer = {
  questionIndex: number;
  questionId?: string;
  response: string[];
  correct: boolean;
  flagged: boolean;
  domainId?: string;
  objectiveId?: string;
  confidence?: StudyConfidence;
  sourceDatasetId?: string;
  sourceDatasetSlug?: string;
  sourceQuestionId?: string;
};

export type DomainResult = {
  domainId: string;
  correct: number;
  total: number;
};

export type AttemptRecord = {
  version: 2;
  id: string;
  datasetId: string;
  slug: string;
  title: string;
  mode: QuizMode;
  score: number;
  total: number;
  percentage: number;
  readinessTarget: number;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  expired?: boolean;
  answers: AttemptAnswer[];
  domains: DomainResult[];
  examCode?: string;
  studyDrill?: boolean;
  academyChallenge?: {
    challengeId: string;
    kind: 'domain-boss' | 'final-boss';
    domainId?: string;
  };
};

export type ActiveExamSession = {
  version: 1;
  datasetId: string;
  slug: string;
  title: string;
  itemOrder: number[];
  optionOrders: Record<string, string[]>;
  answers: Record<string, string[]>;
  confidence?: Record<string, StudyConfidence>;
  activityRecorded?: number[];
  flags: number[];
  currentIndex: number;
  startedAt: string;
  expiresAt: string;
};

/** Legacy shape retained for migration and old callers during upgrades. */
export type ScoreRecord = {
  datasetId: string;
  title: string;
  score: number;
  total: number;
  completedAt: string;
};

const ATTEMPT_KEY = 'quiz-arcade:attempts:v2';
const SESSION_KEY = 'quiz-arcade:active-exams:v1';
const LEGACY_SCORE_KEY = 'quiz-arcade:scores';
const MAX_ATTEMPTS = 80;

export function getAttempts(): AttemptRecord[] {
  const stored = readJson<AttemptRecord[]>(ATTEMPT_KEY, []);
  if (stored.length > 0) return stored.filter(isAttemptRecord);

  const migrated = getLegacyScores().map<AttemptRecord>((score, index) => ({
    version: 2,
    id: `legacy-${score.datasetId}-${index}`,
    datasetId: score.datasetId,
    slug: '',
    title: score.title,
    mode: 'practice',
    score: score.score,
    total: score.total,
    percentage: score.total ? Math.round((score.score / score.total) * 100) : 0,
    readinessTarget: 70,
    startedAt: score.completedAt,
    completedAt: score.completedAt,
    durationSeconds: 0,
    answers: [],
    domains: []
  }));

  if (migrated.length) writeJson(ATTEMPT_KEY, migrated);
  return migrated;
}

export function saveAttempt(record: AttemptRecord): AttemptRecord[] {
  const attempts = [record, ...getAttempts().filter((attempt) => attempt.id !== record.id)].slice(0, MAX_ATTEMPTS);
  writeJson(ATTEMPT_KEY, attempts);
  return attempts;
}

export function getLatestAttempt(datasetId: string, mode?: QuizMode): AttemptRecord | undefined {
  return getAttempts().find((attempt) => attempt.datasetId === datasetId && (!mode || attempt.mode === mode));
}

export function getActiveExamSessions(): ActiveExamSession[] {
  const sessions = readJson<unknown>(SESSION_KEY, []);
  return Array.isArray(sessions) ? sessions.filter((session): session is ActiveExamSession => session?.version === 1) : [];
}

export function getActiveExamSession(datasetId: string): ActiveExamSession | undefined {
  return getActiveExamSessions().find((session) => session.datasetId === datasetId);
}

export function saveActiveExamSession(session: ActiveExamSession): void {
  const sessions = [session, ...getActiveExamSessions().filter((current) => current.datasetId !== session.datasetId)].slice(0, 8);
  writeJson(SESSION_KEY, sessions);
}

export function clearActiveExamSession(datasetId: string): void {
  writeJson(SESSION_KEY, getActiveExamSessions().filter((session) => session.datasetId !== datasetId));
}

export function hasResumableExam(datasetId: string, now = Date.now()): boolean {
  const session = getActiveExamSession(datasetId);
  return Boolean(session && new Date(session.expiresAt).getTime() > now);
}

export function getScores(): ScoreRecord[] {
  return getAttempts().map(({ datasetId, title, score, total, completedAt }) => ({ datasetId, title, score, total, completedAt }));
}

export function saveScore(record: ScoreRecord): void {
  const completed = new Date(record.completedAt).getTime();
  saveAttempt({
    version: 2,
    id: `compat-${record.datasetId}-${completed}`,
    datasetId: record.datasetId,
    slug: '',
    title: record.title,
    mode: 'practice',
    score: record.score,
    total: record.total,
    percentage: record.total ? Math.round((record.score / record.total) * 100) : 0,
    readinessTarget: 70,
    startedAt: record.completedAt,
    completedAt: record.completedAt,
    durationSeconds: 0,
    answers: [],
    domains: []
  });
}

function getLegacyScores(): ScoreRecord[] {
  return readJson<ScoreRecord[]>(LEGACY_SCORE_KEY, []).filter((score) => (
    score && typeof score.datasetId === 'string' && typeof score.score === 'number'
  ));
}

function isAttemptRecord(value: AttemptRecord): boolean {
  return value?.version === 2 && typeof value.id === 'string' && typeof value.datasetId === 'string';
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Progress should never prevent a learner from continuing a quiz.
  }
}
