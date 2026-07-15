import { describe, expect, it } from 'vitest';
import { resolveHighlight } from './annotations';
import { getRevisionCourse } from './registry';
import type { RevisionHighlight, RevisionPage } from './types';

const course = getRevisionCourse('AI-901')!;
const page = course.pages[0];
const block = page.blocks.find((item) => item.type === 'text')!;
const text = block.type === 'text' ? block.paragraphs![0] : '';
const quote = 'lifecycle discipline';
const offset = text.indexOf(quote);
const base: RevisionHighlight = {
  id: 'highlight-1', courseCode: 'AI-901', pageId: page.id, blockId: block.id, kind: 'text', color: 'yellow',
  segmentId: 'p0', quote, startOffset: offset, endOffset: offset + quote.length,
  prefix: text.slice(offset - 20, offset), suffix: text.slice(offset + quote.length, offset + quote.length + 20),
  createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-07-15T10:00:00.000Z', contentVersion: course.contentVersion
};

describe('revision highlight anchoring', () => {
  it('resolves exact saved offsets', () => {
    expect(resolveHighlight(base, page)).toMatchObject({ detached: false, resolvedSegmentId: 'p0', resolvedStart: offset });
  });

  it('uses quote context after text moves', () => {
    const moved = structuredClone(page) as RevisionPage;
    const movedBlock = moved.blocks.find((item) => item.id === block.id)!;
    if (movedBlock.type === 'text') movedBlock.paragraphs![0] = `New introduction. ${text}`;
    const resolved = resolveHighlight(base, moved);
    expect(resolved.detached).toBe(false);
    expect(resolved.resolvedStart).toBeGreaterThan(offset);
  });

  it('preserves unresolvable annotations as detached', () => {
    const changed = structuredClone(page) as RevisionPage;
    const changedBlock = changed.blocks.find((item) => item.id === block.id)!;
    if (changedBlock.type === 'text') changedBlock.paragraphs![0] = 'Completely replaced content.';
    expect(resolveHighlight(base, changed)).toMatchObject({ detached: true });
  });
});
