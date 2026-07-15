// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { RevisionHighlight } from './types';
import {
  emptyRevisionState, exportRevisionState, getRevisionState, importRevisionState, mergeRevisionStates,
  revisionPageKey, toggleReviewedPage, toggleRevisionChecklistItem, upsertRevisionHighlight
} from './storage';

function highlight(id: string, updatedAt = '2026-07-15T10:00:00.000Z'): RevisionHighlight {
  return { id, courseCode: 'AI-901', pageId: 'responsible-ai', blockId: 'responsible-ai-overview', kind: 'block', color: 'yellow', createdAt: updatedAt, updatedAt, contentVersion: '1' };
}

describe('RevisionWiki client storage', () => {
  beforeEach(() => localStorage.clear());

  it('toggles reviewed pages independently from exam progress', () => {
    toggleReviewedPage('ai-901', 'responsible-ai');
    expect(getRevisionState().reviewedPages[revisionPageKey('AI-901', 'responsible-ai')]).toBeTruthy();
    toggleReviewedPage('AI-901', 'responsible-ai');
    expect(getRevisionState().reviewedPages).toEqual({});
  });

  it('stores highlights and trims small notes to the documented limit', () => {
    upsertRevisionHighlight({ ...highlight('one'), note: 'x'.repeat(700) });
    expect(getRevisionState().highlights[0].note).toHaveLength(500);
  });

  it('stores revision checklist state with the rest of the portable data', () => {
    toggleRevisionChecklistItem('AI-901', 'responsible-ai', 'responsible-ai-checklist', 'i0');
    const state = getRevisionState();
    expect(state.checkedItems['AI-901/responsible-ai/responsible-ai-checklist/i0']).toBeTruthy();
    expect(JSON.parse(exportRevisionState()).data.checkedItems).toEqual(state.checkedItems);
  });

  it('round-trips a versioned export and rejects unsupported data', () => {
    toggleReviewedPage('AI-901', 'responsible-ai');
    upsertRevisionHighlight(highlight('one'));
    const backup = exportRevisionState();
    localStorage.clear();
    importRevisionState(backup, 'replace');
    expect(getRevisionState().highlights).toHaveLength(1);
    expect(() => importRevisionState('{"version":2}', 'replace')).toThrow('supported RevisionWiki backup');
  });

  it('merges annotations by ID using the newest timestamp', () => {
    const local = { ...emptyRevisionState(), highlights: [highlight('same', '2026-07-15T10:00:00.000Z')] };
    const incoming = { ...emptyRevisionState(), highlights: [{ ...highlight('same', '2026-07-15T11:00:00.000Z'), color: 'mint' as const }, highlight('new')] };
    const merged = mergeRevisionStates(local, incoming);
    expect(merged.highlights).toHaveLength(2);
    expect(merged.highlights.find((item) => item.id === 'same')?.color).toBe('mint');
  });
});
