import { Highlighter, MessageSquarePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ResolvedRevisionHighlight } from '../annotations';
import type { RevisionBlock, RevisionHighlightColor } from '../types';

export function RevisionBlockView({ block, highlights, onHighlight, onNote, onDelete, checkedItems, onToggleChecklist }: {
  block: RevisionBlock;
  highlights: ResolvedRevisionHighlight[];
  onHighlight: (blockId: string, color: RevisionHighlightColor) => void;
  onNote: (blockId: string) => void;
  onDelete: (id: string) => void;
  checkedItems?: Set<string>;
  onToggleChecklist?: (blockId: string, itemId: string) => void;
}) {
  const blockHighlight = highlights.find((highlight) => highlight.kind === 'block' && !highlight.detached);
  const segmentHighlights = highlights.filter((highlight) => highlight.kind === 'text' && !highlight.detached);
  return (
    <section id={block.id} data-wiki-block={block.id} className={`revision-block ${block.type} ${blockHighlight ? `block-highlight ${blockHighlight.color}` : ''}`}>
      <div className="revision-block-tools">
        {blockHighlight ? (
          <button onClick={() => onDelete(blockHighlight.id)} title="Remove block highlight"><Trash2 size={15} /> <span>Unhighlight</span></button>
        ) : (
          <button onClick={() => onHighlight(block.id, 'yellow')} title="Highlight this section"><Highlighter size={15} /> <span>Highlight</span></button>
        )}
        <button onClick={() => onNote(block.id)} title="Add a note to this section"><MessageSquarePlus size={15} /> <span>Add note</span></button>
      </div>
      {block.title && <h2>{block.title}</h2>}
      {block.type === 'text' && <>
        {block.paragraphs?.map((paragraph, index) => <SelectableText as="p" blockId={block.id} segmentId={`p${index}`} text={paragraph} highlights={segmentHighlights} key={`p${index}`} />)}
        {block.bullets && <ul>{block.bullets.map((item, index) => <SelectableText as="li" blockId={block.id} segmentId={`b${index}`} text={item} highlights={segmentHighlights} key={`b${index}`} />)}</ul>}
      </>}
      {block.type === 'callout' && <div className={`revision-callout ${block.tone}`}>{block.paragraphs.map((paragraph, index) => <SelectableText as="p" blockId={block.id} segmentId={`p${index}`} text={paragraph} highlights={segmentHighlights} key={`p${index}`} />)}</div>}
      {block.type === 'checklist' && <ul className="revision-checklist">{block.items.map((item, index) => {
        const itemId = `i${index}`;
        const checked = checkedItems?.has(`${block.id}/${itemId}`) ?? false;
        return <li className={checked ? 'checked' : ''} key={itemId}><label><input type="checkbox" checked={checked} onChange={() => onToggleChecklist?.(block.id, itemId)} /><span className="revision-checkbox" aria-hidden="true" /> <SelectableText as="span" blockId={block.id} segmentId={itemId} text={item} highlights={segmentHighlights} /></label></li>;
      })}</ul>}
      {block.type === 'comparison' && <div className="revision-table-wrap"><table><thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}
      {block.type === 'flow' && <div className="revision-flow">{block.steps.map((step, index) => <div key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></div>)}</div>}
      {block.type === 'quick-check' && <div className="quick-check-list">{block.items.map((item) => <QuickCheck question={item.question} answer={item.answer} key={item.question} />)}</div>}
    </section>
  );
}

function SelectableText({ as, blockId, segmentId, text, highlights }: {
  as: 'p' | 'li' | 'span';
  blockId: string;
  segmentId: string;
  text: string;
  highlights: ResolvedRevisionHighlight[];
}) {
  const ranges = highlights
    .filter((highlight) => highlight.resolvedSegmentId === segmentId && highlight.resolvedStart !== undefined && highlight.resolvedEnd !== undefined)
    .sort((left, right) => (left.resolvedStart ?? 0) - (right.resolvedStart ?? 0));
  const children: React.ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    const start = Math.max(cursor, range.resolvedStart ?? 0);
    const end = Math.min(text.length, range.resolvedEnd ?? 0);
    if (end <= start) continue;
    if (start > cursor) children.push(text.slice(cursor, start));
    children.push(<mark className={`revision-mark ${range.color}`} key={range.id} title={range.note || 'Saved highlight'}>{text.slice(start, end)}</mark>);
    cursor = end;
  }
  if (cursor < text.length) children.push(text.slice(cursor));
  const props = { 'data-wiki-text': 'true', 'data-block-id': blockId, 'data-segment-id': segmentId, children: children.length ? children : text };
  if (as === 'li') return <li {...props} />;
  if (as === 'span') return <span {...props} />;
  return <p {...props} />;
}

function QuickCheck({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return <button className={open ? 'quick-check open' : 'quick-check'} onClick={() => setOpen((value) => !value)} aria-expanded={open}><strong>{question}</strong><span>{open ? answer : 'Reveal answer'}</span></button>;
}
