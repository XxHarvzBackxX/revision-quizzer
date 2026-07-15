import { useEffect, useState } from 'react';
import type { RevisionHighlight, RevisionStateV1 } from './types';

export const REVISION_STORAGE_KEY = 'quiz-arcade:revision:v1';
const REVISION_EVENT = 'quiz-arcade:revision-changed';

export function emptyRevisionState(): RevisionStateV1 {
  return { version: 1, reviewedPages: {}, highlights: [], lastVisited: {}, preferences: { searchScope: 'course' } };
}

export function getRevisionState(): RevisionStateV1 {
  try {
    return normalizeRevisionState(JSON.parse(localStorage.getItem(REVISION_STORAGE_KEY) ?? 'null')) ?? emptyRevisionState();
  } catch {
    return emptyRevisionState();
  }
}

export function saveRevisionState(state: RevisionStateV1): RevisionStateV1 {
  const normalized = normalizeRevisionState(state) ?? emptyRevisionState();
  try {
    localStorage.setItem(REVISION_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(REVISION_EVENT));
  } catch {
    // Revision tools remain usable even if this browser blocks or fills local storage.
  }
  return normalized;
}

export function toggleReviewedPage(courseCode: string, pageId: string): RevisionStateV1 {
  const state = getRevisionState();
  const key = revisionPageKey(courseCode, pageId);
  const reviewedPages = { ...state.reviewedPages };
  if (reviewedPages[key]) delete reviewedPages[key];
  else reviewedPages[key] = new Date().toISOString();
  return saveRevisionState({ ...state, reviewedPages });
}

export function setLastVisited(courseCode: string, pageId: string, blockId?: string): RevisionStateV1 {
  const state = getRevisionState();
  return saveRevisionState({
    ...state,
    lastVisited: {
      ...state.lastVisited,
      [courseCode.toUpperCase()]: { pageId, ...(blockId ? { blockId } : {}), visitedAt: new Date().toISOString() }
    }
  });
}

export function upsertRevisionHighlight(highlight: RevisionHighlight): RevisionStateV1 {
  const state = getRevisionState();
  const clean: RevisionHighlight = {
    ...highlight,
    courseCode: highlight.courseCode.toUpperCase(),
    quote: highlight.quote?.slice(0, 1200),
    prefix: highlight.prefix?.slice(-80),
    suffix: highlight.suffix?.slice(0, 80),
    note: highlight.note?.slice(0, 500),
    updatedAt: new Date().toISOString()
  };
  const highlights = state.highlights.filter((current) => {
    if (current.id === clean.id) return false;
    if (clean.kind !== 'text' || current.kind !== 'text') return true;
    if (current.courseCode !== clean.courseCode || current.pageId !== clean.pageId || current.blockId !== clean.blockId || current.segmentId !== clean.segmentId) return true;
    if (current.startOffset === undefined || current.endOffset === undefined || clean.startOffset === undefined || clean.endOffset === undefined) return true;
    return current.endOffset <= clean.startOffset || current.startOffset >= clean.endOffset;
  });
  return saveRevisionState({ ...state, highlights: [clean, ...highlights].slice(0, 1000) });
}

export function deleteRevisionHighlight(id: string): RevisionStateV1 {
  const state = getRevisionState();
  return saveRevisionState({ ...state, highlights: state.highlights.filter((highlight) => highlight.id !== id) });
}

export function setRevisionSearchScope(searchScope: 'course' | 'all'): RevisionStateV1 {
  const state = getRevisionState();
  return saveRevisionState({ ...state, preferences: { ...state.preferences, searchScope } });
}

export function resetRevisionState(): RevisionStateV1 {
  return saveRevisionState(emptyRevisionState());
}

export function exportRevisionState(state = getRevisionState()): string {
  return JSON.stringify({ app: 'Quiz Arcade RevisionWiki', exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export function importRevisionState(json: string, mode: 'merge' | 'replace' = 'merge'): RevisionStateV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const envelope = isRecord(parsed) && 'data' in parsed ? parsed.data : parsed;
  const incoming = normalizeRevisionState(envelope);
  if (!incoming) throw new Error('This is not a supported RevisionWiki backup.');
  if (mode === 'replace') return saveRevisionState(incoming);
  return saveRevisionState(mergeRevisionStates(getRevisionState(), incoming));
}

export function mergeRevisionStates(local: RevisionStateV1, incoming: RevisionStateV1): RevisionStateV1 {
  const byId = new Map(local.highlights.map((highlight) => [highlight.id, highlight]));
  for (const highlight of incoming.highlights) {
    const current = byId.get(highlight.id);
    if (!current || Date.parse(highlight.updatedAt) >= Date.parse(current.updatedAt)) byId.set(highlight.id, highlight);
  }
  return {
    version: 1,
    reviewedPages: mergeTimestampRecords(local.reviewedPages, incoming.reviewedPages),
    highlights: Array.from(byId.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 1000),
    lastVisited: mergeLastVisited(local.lastVisited, incoming.lastVisited),
    preferences: local.preferences
  };
}

export function revisionPageKey(courseCode: string, pageId: string): string {
  return `${courseCode.toUpperCase()}/${pageId}`;
}

export function useRevisionState(): RevisionStateV1 {
  const [state, setState] = useState<RevisionStateV1>(() => getRevisionState());
  useEffect(() => {
    const update = () => setState(getRevisionState());
    const onStorage = (event: StorageEvent) => {
      if (event.key === REVISION_STORAGE_KEY) update();
    };
    window.addEventListener(REVISION_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(REVISION_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return state;
}

function normalizeRevisionState(value: unknown): RevisionStateV1 | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const reviewedPages = stringRecord(value.reviewedPages);
  const lastVisited = isRecord(value.lastVisited) ? Object.fromEntries(Object.entries(value.lastVisited).flatMap(([key, visit]) => {
    if (!isRecord(visit) || typeof visit.pageId !== 'string' || typeof visit.visitedAt !== 'string') return [];
    return [[key.toUpperCase(), { pageId: visit.pageId, ...(typeof visit.blockId === 'string' ? { blockId: visit.blockId } : {}), visitedAt: visit.visitedAt }]];
  })) : {};
  const highlights = Array.isArray(value.highlights) ? value.highlights.flatMap((entry) => normalizeHighlight(entry) ?? []) : [];
  const scope = isRecord(value.preferences) && value.preferences.searchScope === 'all' ? 'all' : 'course';
  return { version: 1, reviewedPages, highlights: highlights.slice(0, 1000), lastVisited, preferences: { searchScope: scope } };
}

function normalizeHighlight(value: unknown): RevisionHighlight | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.courseCode !== 'string' || typeof value.pageId !== 'string' || typeof value.blockId !== 'string') return null;
  if (value.kind !== 'block' && value.kind !== 'text') return null;
  if (value.color !== 'yellow' && value.color !== 'mint' && value.color !== 'violet' && value.color !== 'rose') return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string' || typeof value.contentVersion !== 'string') return null;
  return {
    id: value.id,
    courseCode: value.courseCode.toUpperCase(),
    pageId: value.pageId,
    blockId: value.blockId,
    kind: value.kind,
    color: value.color,
    ...(typeof value.segmentId === 'string' ? { segmentId: value.segmentId } : {}),
    ...(typeof value.quote === 'string' ? { quote: value.quote.slice(0, 1200) } : {}),
    ...(typeof value.prefix === 'string' ? { prefix: value.prefix.slice(-80) } : {}),
    ...(typeof value.suffix === 'string' ? { suffix: value.suffix.slice(0, 80) } : {}),
    ...(typeof value.startOffset === 'number' ? { startOffset: value.startOffset } : {}),
    ...(typeof value.endOffset === 'number' ? { endOffset: value.endOffset } : {}),
    ...(typeof value.note === 'string' ? { note: value.note.slice(0, 500) } : {}),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    contentVersion: value.contentVersion
  };
}

function mergeTimestampRecords(left: Record<string, string>, right: Record<string, string>): Record<string, string> {
  const merged = { ...left };
  for (const [key, value] of Object.entries(right)) {
    if (!merged[key] || value > merged[key]) merged[key] = value;
  }
  return merged;
}

function mergeLastVisited(left: RevisionStateV1['lastVisited'], right: RevisionStateV1['lastVisited']): RevisionStateV1['lastVisited'] {
  const merged = { ...left };
  for (const [key, visit] of Object.entries(right)) {
    if (!merged[key] || visit.visitedAt >= merged[key].visitedAt) merged[key] = visit;
  }
  return merged;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
