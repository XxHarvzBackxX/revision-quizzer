import type { Difficulty } from '../../shared/quiz';

export type StudyPoolFilter = 'weakest' | 'missed' | 'bookmarked' | 'unseen' | 'all';

export type StudySettings = {
  dailyQuestionGoal: 5 | 10 | 20 | 30;
  showExamConfidence: boolean;
};

export type StudyBookmark = {
  key: string;
  examCode: string;
  datasetId: string;
  datasetSlug: string;
  questionId: string;
  prompt: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyActivityDay = {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  examsSubmitted: number;
  reviewedGuides: string[];
  xp: number;
  goalAwarded: boolean;
};

export type StudyDrillConfig = {
  examCode: string;
  filter: StudyPoolFilter;
  objectiveId?: string;
  domainId?: string;
  difficulty?: Difficulty;
  count: number;
  questionKeys: string[];
  seed: string;
  createdAt: string;
};

export type StudyStateV1 = {
  version: 1;
  settings: StudySettings;
  bookmarks: Record<string, StudyBookmark>;
  activity: Record<string, StudyActivityDay>;
  activeDrills: Record<string, StudyDrillConfig>;
};

export type MasteryStatus = 'unseen' | 'building' | 'needs-work' | 'developing' | 'ready';

export type ObjectiveMastery = {
  objectiveId: string;
  title: string;
  domainId: string;
  domainTitle: string;
  blueprintWeight: number;
  score: number;
  evidence: number;
  confidentWrong: number;
  lastAnsweredAt?: string;
  status: MasteryStatus;
};

export type StudyRecommendation = {
  kind: 'revision' | 'drill' | 'mock';
  title: string;
  description: string;
  objectiveId?: string;
};
