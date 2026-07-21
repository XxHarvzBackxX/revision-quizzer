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
  mode?: 'practice' | 'domain-boss' | 'final-boss';
  challengeId?: string;
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

export type AcademyQuestKind = 'answer' | 'correct' | 'objective' | 'bookmarked' | 'guide' | 'drill';
export type AcademyQuestPeriod = 'daily' | 'weekly';

export type AcademyQuest = {
  id: string;
  examCode: string;
  period: AcademyQuestPeriod;
  periodKey: string;
  slot: number;
  kind: AcademyQuestKind;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardXp: number;
  objectiveId?: string;
  completedAt?: string;
  claimedAt?: string;
  replacedBy?: string;
  rerolledFrom?: string;
};

export type AcademyChallengeProgress = {
  challengeId: string;
  examCode: string;
  kind: 'domain-boss' | 'final-boss';
  domainId?: string;
  bestPercentage: number;
  attempts: number;
  attemptIds: string[];
  passedAt?: string;
  rewardedAt?: string;
};

export type AcademyAchievement = {
  id: string;
  unlockedAt: string;
};

export type AcademyInventory = {
  rerolls: number;
  streakShields: number;
  unlockedCosmetics: string[];
  equippedTitle: string;
  equippedToken: string;
};

export type StudyAcademyState = {
  quests: Record<string, AcademyQuest>;
  challenges: Record<string, AcademyChallengeProgress>;
  achievements: Record<string, AcademyAchievement>;
  inventory: AcademyInventory;
  protectedDates: string[];
  claimedPeriodBonuses: string[];
};

export type StudyStateV2 = Omit<StudyStateV1, 'version'> & {
  version: 2;
  academy: StudyAcademyState;
};

export type StudyState = StudyStateV2;

export type StudyActivityEvent = {
  kind: 'question' | 'guide' | 'drill';
  examCode?: string;
  objectiveId?: string;
  correct?: boolean;
  bookmarked?: boolean;
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
