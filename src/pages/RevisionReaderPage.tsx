import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, ExternalLink, Highlighter, Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Navigate, ToastKind } from '../types';
import { createHighlightId, resolveHighlight } from '../revision/annotations';
import { AnnotationPanel } from '../revision/components/AnnotationPanel';
import { RevisionBlockView } from '../revision/components/RevisionBlockView';
import { RevisionSearch } from '../revision/components/RevisionSearch';
import { getRevisionCourse, getRevisionPage } from '../revision/registry';
import { deleteRevisionHighlight, revisionPageKey, setLastVisited, toggleReviewedPage, upsertRevisionHighlight, useRevisionState } from '../revision/storage';
import type { RevisionHighlightColor } from '../revision/types';

type PendingSelection = { blockId: string; segmentId: string; quote: string; prefix: string; suffix: string; start: number; end: number; top: number; left: number };
const colors: RevisionHighlightColor[] = ['yellow', 'mint', 'violet', 'rose'];

export function RevisionReaderPage({ examCode, pageSlug, navigate, onToast }: { examCode: string; pageSlug: string; navigate: Navigate; onToast: (kind: ToastKind, message: string) => void }) {
  const course = getRevisionCourse(examCode);
  const page = course && getRevisionPage(course, pageSlug);
  const state = useRevisionState();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [pendingNote, setPendingNote] = useState('');
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [blockNote, setBlockNote] = useState('');

  const pageHighlights = useMemo(() => page ? state.highlights
    .filter((highlight) => highlight.courseCode === course?.examCode && highlight.pageId === page.id)
    .map((highlight) => resolveHighlight(highlight, page)) : [], [state.highlights, page, course?.examCode]);

  useEffect(() => {
    if (!course || !page) return;
    setLastVisited(course.examCode, page.id);
  }, [course?.examCode, page?.id]);

  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  }, [page?.id, hash]);

  if (!course || !page) return <section className="wiki-not-found"><BookOpen size={34} /><h1>Revision page not found.</h1><button className="primary-button" onClick={() => navigate('/wiki')}>Open RevisionWiki</button></section>;
  const activeCourse = course;
  const activePage = page;
  const pageIndex = course.pages.findIndex((item) => item.id === page.id);
  const previous = course.pages[pageIndex - 1];
  const next = course.pages[pageIndex + 1];
  const reviewed = Boolean(state.reviewedPages[revisionPageKey(course.examCode, page.id)]);

  function addBlockHighlight(blockId: string, color: RevisionHighlightColor, note?: string) {
    const existing = pageHighlights.find((highlight) => highlight.blockId === blockId && highlight.kind === 'block');
    const now = new Date().toISOString();
    upsertRevisionHighlight(existing ? { ...existing, color } : {
      id: createHighlightId(), courseCode: activeCourse.examCode, pageId: activePage.id, blockId, kind: 'block', color,
      ...(note !== undefined ? { note } : {}), createdAt: now, updatedAt: now, contentVersion: activeCourse.contentVersion
    });
  }

  function openBlockNote(blockId: string) {
    const existing = pageHighlights.find((highlight) => highlight.blockId === blockId && highlight.kind === 'block');
    setBlockNote(existing?.note ?? '');
    setPendingBlockId(blockId);
  }

  function saveBlockNote(color: RevisionHighlightColor) {
    if (!pendingBlockId) return;
    addBlockHighlight(pendingBlockId, color, blockNote.trim());
    setPendingBlockId(null);
    setBlockNote('');
    onToast('success', 'Personal note saved.');
  }

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const startElement = elementForNode(range.startContainer)?.closest<HTMLElement>('[data-wiki-text]');
    const endElement = elementForNode(range.endContainer)?.closest<HTMLElement>('[data-wiki-text]');
    if (!startElement || startElement !== endElement) return;
    const quote = selection.toString();
    if (quote.trim().length < 2) return;
    const before = document.createRange();
    before.selectNodeContents(startElement);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const text = startElement.textContent ?? '';
    const rect = range.getBoundingClientRect();
    setPending({
      blockId: startElement.dataset.blockId ?? '', segmentId: startElement.dataset.segmentId ?? '', quote,
      prefix: text.slice(Math.max(0, start - 40), start), suffix: text.slice(start + quote.length, start + quote.length + 40),
      start, end: start + quote.length,
      top: Math.min(window.innerHeight - 150, Math.max(12, rect.bottom + 10)),
      left: Math.min(window.innerWidth - 330, Math.max(12, rect.left))
    });
    setPendingNote('');
  }

  function saveSelection(color: RevisionHighlightColor) {
    if (!pending) return;
    const now = new Date().toISOString();
    upsertRevisionHighlight({
      id: createHighlightId(), courseCode: activeCourse.examCode, pageId: activePage.id, blockId: pending.blockId, kind: 'text', color,
      segmentId: pending.segmentId, quote: pending.quote, prefix: pending.prefix, suffix: pending.suffix,
      startOffset: pending.start, endOffset: pending.end, note: pendingNote.trim(), createdAt: now, updatedAt: now, contentVersion: activeCourse.contentVersion
    });
    window.getSelection()?.removeAllRanges();
    setPending(null);
    setPendingNote('');
  }

  return (
    <section className="revision-reader-page" style={{ '--course-accent': course.accent } as React.CSSProperties}>
      <button className="revision-mobile-nav" onClick={() => setNavigationOpen(true)}><Menu size={17} /> Contents</button>
      <div className={`revision-reader-grid ${navigationOpen ? 'nav-open' : ''}`}>
        <aside className="revision-reader-nav">
          <button className="revision-nav-close" onClick={() => setNavigationOpen(false)} aria-label="Close contents"><X size={18} /></button>
          <button className="revision-course-back" onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}`)}><ArrowLeft size={15} /> {course.examCode} overview</button>
          <RevisionSearch compact examCode={course.examCode} navigate={navigate} />
          <div className="revision-nav-progress"><span><strong>{course.pages.filter((item) => state.reviewedPages[revisionPageKey(course.examCode, item.id)]).length}</strong> / {course.pages.length} reviewed</span><div><i style={{ width: `${course.pages.filter((item) => state.reviewedPages[revisionPageKey(course.examCode, item.id)]).length / course.pages.length * 100}%` }} /></div></div>
          <nav>{course.domains.map((domain) => <div key={domain.id}><strong>{domain.title}</strong>{course.pages.filter((item) => item.domainId === domain.id).map((item) => <button className={item.id === page.id ? 'active' : ''} onClick={() => { navigate(`/wiki/${course.examCode.toLowerCase()}/${item.slug}`); setNavigationOpen(false); }} key={item.id}>{state.reviewedPages[revisionPageKey(course.examCode, item.id)] && <Check size={13} />}{item.title}</button>)}</div>)}</nav>
          <div className="revision-on-this-page"><strong>On this page</strong>{page.blocks.map((block) => <button onClick={() => document.getElementById(block.id)?.scrollIntoView({ behavior: 'smooth' })} key={block.id}>{block.title}</button>)}</div>
        </aside>

        <main className="revision-article" onMouseUp={captureSelection}>
          <header className="revision-article-header">
            <div className="revision-breadcrumb"><button onClick={() => navigate('/wiki')}>RevisionWiki</button><span>/</span><button onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}`)}>{course.examCode}</button></div>
            <span className="revision-objective">Objective {pageIndex + 1} of {course.pages.length}</span>
            <h1>{page.title}</h1><p>{page.summary}</p>
            <div className="revision-article-meta"><span><Clock3 size={15} /> {page.estimatedMinutes} minute read</span><span>Verified {course.lastReviewed}</span><button className={reviewed ? 'reviewed' : ''} onClick={() => toggleReviewedPage(course.examCode, page.id)}>{reviewed ? <CheckCircle2 size={16} /> : <span />} {reviewed ? 'Reviewed' : 'Mark reviewed'}</button></div>
          </header>

          <section className="blueprint-checklist"><span>Blueprint checklist</span><ul>{page.blueprintPoints.map((point) => <li key={point}><Check size={15} /> {point}</li>)}</ul></section>

          <div className="revision-blocks">
            {page.blocks.map((block) => <RevisionBlockView block={block} highlights={pageHighlights.filter((highlight) => highlight.blockId === block.id)} onHighlight={addBlockHighlight} onNote={openBlockNote} onDelete={deleteRevisionHighlight} key={block.id} />)}
          </div>

          <section className="revision-sources"><span className="section-kicker">Official references</span><h2>Continue in Microsoft Learn</h2><p>This guide is an original exam-focused companion. Use the official material for product detail, hands-on exercises, and updates.</p>{page.sourceIds.map((id) => course.sources.find((source) => source.id === id)).filter(Boolean).map((source) => <a href={source!.url} target="_blank" rel="noreferrer" key={source!.id}>{source!.title} <ExternalLink size={15} /></a>)}</section>

          <footer className="revision-page-footer">{previous ? <button onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}/${previous.slug}`)}><ArrowLeft size={17} /><span><small>Previous</small><strong>{previous.title}</strong></span></button> : <span />}{next ? <button className="next" onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}/${next.slug}`)}><span><small>Next</small><strong>{next.title}</strong></span><ArrowRight size={17} /></button> : <button className="next" onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}`)}><span><small>Course complete</small><strong>Review your progress</strong></span><CheckCircle2 size={17} /></button>}</footer>
        </main>

        <AnnotationPanel course={course} page={page} current={pageHighlights} all={state.highlights} navigate={navigate} />
      </div>

      {pending && <div className="selection-toolbar" style={{ top: pending.top, left: pending.left }} onMouseDown={(event) => event.preventDefault()}><div><Highlighter size={15} /><span>Save highlight</span><button onClick={() => setPending(null)}><X size={14} /></button></div><input maxLength={500} value={pendingNote} onChange={(event) => setPendingNote(event.target.value)} placeholder="Optional note…" /> <div className="selection-colors">{colors.map((color) => <button className={color} onClick={() => saveSelection(color)} aria-label={`Save ${color} highlight`} key={color} />)}</div></div>}
      {pendingBlockId && <div className="block-note-backdrop" onMouseDown={() => setPendingBlockId(null)}><div className="block-note-composer" onMouseDown={(event) => event.stopPropagation()}><div><Highlighter size={18} /><span><strong>Save a section note</strong><small>Choose a colour to save</small></span><button onClick={() => setPendingBlockId(null)} aria-label="Close note"><X size={17} /></button></div><textarea autoFocus maxLength={500} value={blockNote} onChange={(event) => setBlockNote(event.target.value)} placeholder="Add your own reminder, mnemonic, or question…" /><small>{blockNote.length}/500</small><div className="selection-colors">{colors.map((color) => <button className={color} onClick={() => saveBlockNote(color)} aria-label={`Save ${color} section note`} key={color} />)}</div></div></div>}
    </section>
  );
}

function elementForNode(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
}
