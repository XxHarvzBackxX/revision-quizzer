import { Check, Highlighter, LocateFixed, MessageSquare, Trash2, Unlink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Navigate } from '../../types';
import type { ResolvedRevisionHighlight } from '../annotations';
import { deleteRevisionHighlight, upsertRevisionHighlight } from '../storage';
import type { RevisionCourse, RevisionHighlight, RevisionHighlightColor, RevisionPage } from '../types';

const colors: RevisionHighlightColor[] = ['yellow', 'mint', 'violet', 'rose'];

export function AnnotationPanel({ course, page, current, all, navigate }: {
  course: RevisionCourse;
  page: RevisionPage;
  current: ResolvedRevisionHighlight[];
  all: RevisionHighlight[];
  navigate: Navigate;
}) {
  const [scope, setScope] = useState<'page' | 'course'>('page');
  const annotations = useMemo(() => scope === 'page' ? current : all.filter((item) => item.courseCode === course.examCode), [scope, current, all, course.examCode]);
  return (
    <aside className="annotation-panel">
      <div className="annotation-heading"><span><MessageSquare size={17} /><strong>My notes</strong></span><small>{annotations.length}</small></div>
      <div className="annotation-tabs"><button className={scope === 'page' ? 'active' : ''} onClick={() => setScope('page')}>This page</button><button className={scope === 'course' ? 'active' : ''} onClick={() => setScope('course')}>Course</button></div>
      <div className="annotation-list">
        {annotations.length ? annotations.map((annotation) => {
          const targetPage = course.pages.find((item) => item.id === annotation.pageId);
          const resolved = 'detached' in annotation ? annotation as ResolvedRevisionHighlight : undefined;
          return <AnnotationCard annotation={annotation} pageTitle={targetPage?.title ?? annotation.pageId} detached={resolved?.detached} onJump={() => {
            if (annotation.pageId === page.id) document.getElementById(annotation.blockId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else if (targetPage) navigate(`/wiki/${course.examCode.toLowerCase()}/${targetPage.slug}#${encodeURIComponent(annotation.blockId)}`);
          }} key={annotation.id} />;
        }) : <div className="annotation-empty"><Highlighter size={22} /><p>Highlight a section or select some text to keep a small note beside it.</p></div>}
      </div>
    </aside>
  );
}

function AnnotationCard({ annotation, pageTitle, detached, onJump }: { annotation: RevisionHighlight; pageTitle: string; detached?: boolean; onJump: () => void }) {
  const [draft, setDraft] = useState(annotation.note ?? '');
  useEffect(() => setDraft(annotation.note ?? ''), [annotation.id, annotation.note]);
  function saveNote() {
    const next = draft.trim();
    if (next !== (annotation.note ?? '')) upsertRevisionHighlight({ ...annotation, note: next });
  }
  return (
    <article className={`annotation-card ${annotation.color} ${detached ? 'detached' : ''}`}>
      <div className="annotation-card-top"><span>{annotation.kind === 'text' ? 'Text highlight' : 'Section note'} · {pageTitle}</span><button onClick={() => deleteRevisionHighlight(annotation.id)} aria-label="Delete note"><Trash2 size={14} /></button></div>
      {annotation.quote && <blockquote>“{annotation.quote}”</blockquote>}
      {detached && <p className="detached-warning"><Unlink size={13} /> Source text changed; your note is preserved.</p>}
      <textarea maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={saveNote} placeholder="Add a short personal note…" />
      <div className="annotation-card-footer"><div className="annotation-colors">{colors.map((color) => <button className={`${color} ${annotation.color === color ? 'active' : ''}`} onClick={() => upsertRevisionHighlight({ ...annotation, color })} aria-label={`Use ${color}`} key={color}>{annotation.color === color && <Check size={11} />}</button>)}</div><button onClick={onJump}><LocateFixed size={14} /> Source</button></div>
    </article>
  );
}
