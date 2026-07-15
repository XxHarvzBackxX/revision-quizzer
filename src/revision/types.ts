export type RevisionCalloutTone = 'insight' | 'exam-trap' | 'remember' | 'warning';

export type RevisionSource = {
  id: string;
  title: string;
  url: string;
};

export type RevisionDomain = {
  id: string;
  title: string;
  weight: number;
};

type RevisionBlockBase = {
  id: string;
  title?: string;
};

export type RevisionTextBlock = RevisionBlockBase & {
  type: 'text';
  paragraphs?: string[];
  bullets?: string[];
};

export type RevisionComparisonBlock = RevisionBlockBase & {
  type: 'comparison';
  columns: string[];
  rows: string[][];
};

export type RevisionCalloutBlock = RevisionBlockBase & {
  type: 'callout';
  tone: RevisionCalloutTone;
  paragraphs: string[];
};

export type RevisionChecklistBlock = RevisionBlockBase & {
  type: 'checklist';
  items: string[];
};

export type RevisionFlowBlock = RevisionBlockBase & {
  type: 'flow';
  steps: Array<{ title: string; text: string }>;
};

export type RevisionQuickCheckBlock = RevisionBlockBase & {
  type: 'quick-check';
  items: Array<{ question: string; answer: string }>;
};

export type RevisionBlock =
  | RevisionTextBlock
  | RevisionComparisonBlock
  | RevisionCalloutBlock
  | RevisionChecklistBlock
  | RevisionFlowBlock
  | RevisionQuickCheckBlock;

export type RevisionPage = {
  id: string;
  objectiveId: string;
  slug: string;
  title: string;
  domainId: string;
  summary: string;
  estimatedMinutes: number;
  keywords: string[];
  blueprintPoints: string[];
  sourceIds: string[];
  blocks: RevisionBlock[];
};

export type RevisionCourse = {
  examCode: string;
  title: string;
  shortTitle: string;
  description: string;
  blueprintVersion: string;
  contentVersion: string;
  lastReviewed: string;
  accent: string;
  domains: RevisionDomain[];
  sources: RevisionSource[];
  pages: RevisionPage[];
};

export type RevisionHighlightColor = 'yellow' | 'mint' | 'violet' | 'rose';

export type RevisionHighlight = {
  id: string;
  courseCode: string;
  pageId: string;
  blockId: string;
  kind: 'block' | 'text';
  color: RevisionHighlightColor;
  segmentId?: string;
  quote?: string;
  prefix?: string;
  suffix?: string;
  startOffset?: number;
  endOffset?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  contentVersion: string;
};

export type RevisionStateV1 = {
  version: 1;
  reviewedPages: Record<string, string>;
  checkedItems: Record<string, string>;
  highlights: RevisionHighlight[];
  lastVisited: Record<string, { pageId: string; blockId?: string; visitedAt: string }>;
  preferences: { searchScope: 'course' | 'all' };
};

export type RevisionSearchResult = {
  courseCode: string;
  pageId: string;
  pageSlug: string;
  blockId?: string;
  title: string;
  section?: string;
  excerpt: string;
  score: number;
};

export type RevisionTextSegment = {
  id: string;
  text: string;
};
