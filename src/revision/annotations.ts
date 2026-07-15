import { getBlockSegments } from './registry';
import type { RevisionHighlight, RevisionPage } from './types';

export type ResolvedRevisionHighlight = RevisionHighlight & {
  resolvedSegmentId?: string;
  resolvedStart?: number;
  resolvedEnd?: number;
  detached: boolean;
};

export function resolveHighlight(highlight: RevisionHighlight, page: RevisionPage): ResolvedRevisionHighlight {
  if (highlight.kind === 'block') {
    return { ...highlight, detached: !page.blocks.some((block) => block.id === highlight.blockId) };
  }
  const block = page.blocks.find((item) => item.id === highlight.blockId);
  if (!block || !highlight.quote) return { ...highlight, detached: true };
  const segments = getBlockSegments(block);
  const selected = segments.find((segment) => segment.id === highlight.segmentId);
  if (selected && highlight.startOffset !== undefined && highlight.endOffset !== undefined
    && selected.text.slice(highlight.startOffset, highlight.endOffset) === highlight.quote) {
    return { ...highlight, resolvedSegmentId: selected.id, resolvedStart: highlight.startOffset, resolvedEnd: highlight.endOffset, detached: false };
  }
  const candidates = selected ? [selected, ...segments.filter((segment) => segment.id !== selected.id)] : segments;
  for (const segment of candidates) {
    const exact = findQuoteWithContext(segment.text, highlight.quote, highlight.prefix ?? '', highlight.suffix ?? '');
    if (exact >= 0) {
      return { ...highlight, resolvedSegmentId: segment.id, resolvedStart: exact, resolvedEnd: exact + highlight.quote.length, detached: false };
    }
  }
  return { ...highlight, detached: true };
}

export function createHighlightId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `revision-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function findQuoteWithContext(text: string, quote: string, prefix: string, suffix: string): number {
  let start = text.indexOf(quote);
  if (start < 0) return -1;
  if (!prefix && !suffix) return start;
  while (start >= 0) {
    const prefixMatches = !prefix || text.slice(Math.max(0, start - prefix.length), start).endsWith(prefix);
    const suffixMatches = !suffix || text.slice(start + quote.length, start + quote.length + suffix.length).startsWith(suffix);
    if (prefixMatches && suffixMatches) return start;
    start = text.indexOf(quote, start + 1);
  }
  return -1;
}
