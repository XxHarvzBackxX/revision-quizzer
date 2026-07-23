import type { StudyConfidence } from '../storage';

export type ReviewRecord = {
  key: string;
  datasetId: string;
  datasetSlug: string;
  datasetTitle: string;
  questionId: string;
  questionIndex: number;
  prompt: string;
  examCode?: string;
  objectiveId?: string;
  domainId?: string;
  contentRevision?: string;
  firstWrongAt: string;
  lastWrongAt: string;
  wrongCount: number;
  lastConfidence?: StudyConfidence;
  correctStreak: 0 | 1 | 2;
  dueOn?: string;
  lastCorrectAt?: string;
  recoveredAt?: string;
  available: boolean;
  note?: string;
};

export type ReviewSession = {
  id: string;
  questionKeys: string[];
  createdAt: string;
};

export type ReviewState = {
  version: 1;
  records: Record<string, ReviewRecord>;
  activeSession?: ReviewSession;
  historyImportedAt?: string;
};

export type ReviewStatus = 'due' | 'scheduled' | 'recovered' | 'unavailable';
