import { ArrowRight, BookMarked, CheckCircle2, Download, FileUp, Highlighter, LibraryBig, RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Navigate, ToastKind } from '../types';
import { RevisionSearch } from '../revision/components/RevisionSearch';
import { revisionCourses } from '../revision/registry';
import { exportRevisionState, importRevisionState, resetRevisionState, revisionPageKey, useRevisionState } from '../revision/storage';

export function RevisionWikiIndexPage({ navigate, onToast }: { navigate: Navigate; onToast: (kind: ToastKind, message: string) => void }) {
  const state = useRevisionState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [replaceImport, setReplaceImport] = useState(false);

  function downloadBackup() {
    const blob = new Blob([exportRevisionState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-arcade-revision-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onToast('success', 'Revision progress exported.');
  }

  async function importBackup(file?: File) {
    if (!file) return;
    if (replaceImport && !window.confirm('Replace all current RevisionWiki progress and notes with this backup?')) return;
    try {
      importRevisionState(await file.text(), replaceImport ? 'replace' : 'merge');
      onToast('success', replaceImport ? 'Revision progress replaced from backup.' : 'Revision progress merged from backup.');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not import that backup.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className="revision-index-page">
      <header className="revision-index-hero">
        <div><span className="revision-eyebrow"><LibraryBig size={17} /> RevisionWiki</span><h1>Understand it.<br /><em>Then test it.</em></h1><p>Exam-complete notes, practical comparisons, quick recall, and your own highlights—connected directly to every built-in mock paper.</p></div>
        <div className="revision-index-search"><RevisionSearch navigate={navigate} /><p>Searches all {revisionCourses.reduce((sum, course) => sum + course.pages.length, 0)} objective guides.</p></div>
      </header>

      <div className="revision-index-content">
        <div className="revision-section-heading"><div><span className="section-kicker">Pick up a course</span><h2>Your study guides</h2></div><p>Completion and personal notes stay in this browser.</p></div>
        <div className="revision-course-grid">
          {revisionCourses.map((course) => {
            const reviewed = course.pages.filter((page) => state.reviewedPages[revisionPageKey(course.examCode, page.id)]).length;
            const annotations = state.highlights.filter((highlight) => highlight.courseCode === course.examCode).length;
            const progress = Math.round((reviewed / course.pages.length) * 100);
            const last = state.lastVisited[course.examCode];
            const lastPage = last && course.pages.find((page) => page.id === last.pageId);
            return (
              <article className="revision-course-card" style={{ '--course-accent': course.accent } as React.CSSProperties} key={course.examCode}>
                <div className="revision-course-top"><span>{course.examCode}</span><span>Blueprint {course.blueprintVersion}</span></div>
                <h2>{course.title}</h2><p>{course.description}</p>
                <div className="revision-course-metrics"><span><BookMarked size={16} /> {course.pages.length} guides</span><span><CheckCircle2 size={16} /> {reviewed} reviewed</span><span><Highlighter size={16} /> {annotations} notes</span></div>
                <div className="revision-course-progress"><span style={{ width: `${progress}%` }} /></div>
                <footer><span>{progress}% complete</span><button onClick={() => navigate(lastPage ? `/wiki/${course.examCode.toLowerCase()}/${lastPage.slug}` : `/wiki/${course.examCode.toLowerCase()}`)}>{lastPage ? 'Continue' : 'Open guide'} <ArrowRight size={17} /></button></footer>
              </article>
            );
          })}
        </div>

        <section className="revision-data-card">
          <div><span className="section-kicker">Portable, private progress</span><h2>Your notes belong to you</h2><p>Revision status, highlights, and small notes remain on this device. Export a backup before clearing browser data or moving computers.</p></div>
          <div className="revision-data-actions">
            <button className="secondary-button" onClick={downloadBackup}><Download size={16} /> Export JSON</button>
            <button className="secondary-button" onClick={() => inputRef.current?.click()}><FileUp size={16} /> Import JSON</button>
            <label><input type="checkbox" checked={replaceImport} onChange={(event) => setReplaceImport(event.target.checked)} /> Replace instead of merge</label>
            <button className="revision-reset" onClick={() => {
              if (window.confirm('Clear every reviewed page, highlight, and RevisionWiki note on this browser?')) {
                resetRevisionState();
                onToast('info', 'RevisionWiki progress cleared.');
              }
            }}><RotateCcw size={14} /> Reset revision data</button>
            <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} />
          </div>
        </section>
      </div>
    </section>
  );
}
