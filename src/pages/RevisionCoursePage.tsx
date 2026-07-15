import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Highlighter, Sparkles } from 'lucide-react';
import type { Navigate } from '../types';
import { RevisionSearch } from '../revision/components/RevisionSearch';
import { getRevisionCourse } from '../revision/registry';
import { revisionPageKey, toggleReviewedPage, useRevisionState } from '../revision/storage';

export function RevisionCoursePage({ examCode, navigate }: { examCode: string; navigate: Navigate }) {
  const course = getRevisionCourse(examCode);
  const state = useRevisionState();
  if (!course) return <WikiNotFound navigate={navigate} />;
  const reviewed = course.pages.filter((page) => state.reviewedPages[revisionPageKey(course.examCode, page.id)]).length;
  const totalMinutes = course.pages.reduce((sum, page) => sum + page.estimatedMinutes, 0);
  const last = state.lastVisited[course.examCode];
  const continuePage = course.pages.find((page) => page.id === last?.pageId)
    ?? course.pages.find((page) => !state.reviewedPages[revisionPageKey(course.examCode, page.id)])
    ?? course.pages[0];

  return (
    <section className="revision-course-page" style={{ '--course-accent': course.accent } as React.CSSProperties}>
      <button className="back-link" onClick={() => navigate('/wiki')}><ArrowLeft size={17} /> All study guides</button>
      <header className="revision-course-hero">
        <div><span className="revision-eyebrow"><Sparkles size={16} /> RevisionWiki · {course.examCode}</span><h1>{course.title}</h1><p>{course.description}</p><div className="revision-hero-actions"><button className="primary-button large" onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}/${continuePage.slug}`)}>{last ? 'Continue revision' : 'Start the guide'} <ArrowRight size={18} /></button><RevisionSearch compact examCode={course.examCode} navigate={navigate} /></div></div>
        <div className="revision-progress-orb" style={{ '--progress': `${Math.round((reviewed / course.pages.length) * 360)}deg` } as React.CSSProperties}><div><strong>{Math.round((reviewed / course.pages.length) * 100)}%</strong><span>{reviewed} of {course.pages.length} reviewed</span></div></div>
      </header>
      <div className="revision-course-facts"><span><BookOpen size={17} /> {course.pages.length} objective guides</span><span><Clock3 size={17} /> About {totalMinutes} minutes</span><span><Highlighter size={17} /> {state.highlights.filter((item) => item.courseCode === course.examCode).length} saved annotations</span><span>Verified {course.lastReviewed}</span></div>

      <div className="revision-domain-list">
        {course.domains.map((domain) => (
          <section className="revision-domain" key={domain.id}>
            <header><div><span>{domain.weight}% of mock papers</span><h2>{domain.title}</h2></div><strong>{course.pages.filter((page) => page.domainId === domain.id && state.reviewedPages[revisionPageKey(course.examCode, page.id)]).length}/{course.pages.filter((page) => page.domainId === domain.id).length}</strong></header>
            <div className="revision-page-cards">
              {course.pages.filter((page) => page.domainId === domain.id).map((page, index) => {
                const complete = Boolean(state.reviewedPages[revisionPageKey(course.examCode, page.id)]);
                return <article className={complete ? 'reviewed' : ''} key={page.id}>
                  <button className="review-page-toggle" onClick={() => toggleReviewedPage(course.examCode, page.id)} aria-label={complete ? `Mark ${page.title} not reviewed` : `Mark ${page.title} reviewed`}>{complete ? <Check size={16} /> : index + 1}</button>
                  <button className="revision-page-link" onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}/${page.slug}`)}><span>{page.estimatedMinutes} min · {page.blueprintPoints.length} blueprint points</span><h3>{page.title}</h3><p>{page.summary}</p><small>{complete ? <><CheckCircle2 size={14} /> Reviewed</> : <>Open guide <ArrowRight size={14} /></>}</small></button>
                </article>;
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function WikiNotFound({ navigate }: { navigate: Navigate }) {
  return <section className="wiki-not-found"><BookOpen size={34} /><h1>That study guide is not available yet.</h1><p>AI-901 and AZ-900 are ready now; more certifications can plug into the same RevisionWiki later.</p><button className="primary-button" onClick={() => navigate('/wiki')}>Open RevisionWiki</button></section>;
}
