import { ArrowRight, BookOpenText, CheckCircle2, Flame, Gamepad2, Sparkles, Star, Target } from 'lucide-react';
import type { DatasetSummary } from '../../shared/quiz';
import { revisionCourses } from '../revision/registry';
import { revisionPageKey, useRevisionState } from '../revision/storage';
import type { AttemptRecord } from '../storage';
import { calculateCertificationMastery, certificationReadiness, selectStudyRecommendation } from '../study/mastery';
import { studyStreak, studyTotals, useStudyState } from '../study/storage';
import type { Navigate } from '../types';

export function StudyIndexPage({ datasets, attempts, navigate }: {
  datasets: DatasetSummary[];
  attempts: AttemptRecord[];
  navigate: Navigate;
}) {
  const study = useStudyState();
  const revision = useRevisionState();
  const streak = studyStreak(study);
  const totals = studyTotals(study);

  return (
    <section className="study-index-page">
      <header className="study-index-hero">
        <div>
          <span className="study-index-kicker"><Gamepad2 size={17} /> Smart study plans</span>
          <h1>Pick a certification.<br /><em>Keep the momentum.</em></h1>
          <p>Open your mastery map, follow the next-best recommendation, or build a focused drill from every built-in mock paper.</p>
        </div>
        <div className="study-index-player-card">
          <div><span><Star size={18} /> Level {totals.level}</span><strong>{totals.xp} XP</strong></div>
          <div className="study-index-xp"><span style={{ width: `${totals.levelProgress / 5}%` }} /></div>
          <small>{totals.levelProgress}/500 XP to the next level</small>
          <div className="study-index-streak"><Flame size={20} /><span><strong>{streak.current} day{streak.current === 1 ? '' : 's'}</strong><small>current streak · longest {streak.longest}</small></span></div>
        </div>
      </header>

      <div className="study-index-content">
        <header><div><span className="section-kicker">Certification hubs</span><h2>Where are you heading?</h2></div><p>Progress stays privately in this browser.</p></header>
        <div className="study-course-grid">
          {revisionCourses.map((course) => {
            const mastery = calculateCertificationMastery({ examCode: course.examCode, attempts, datasets, course });
            const readiness = certificationReadiness(mastery);
            const recommendation = selectStudyRecommendation(mastery);
            const reviewed = course.pages.filter((page) => revision.reviewedPages[revisionPageKey(course.examCode, page.id)]).length;
            const bookmarks = Object.values(study.bookmarks).filter((bookmark) => bookmark.examCode === course.examCode).length;
            const readyObjectives = mastery.filter((objective) => objective.status === 'ready').length;
            return (
              <article className="study-course-card" style={{ '--course-accent': course.accent, '--readiness': `${readiness * 3.6}deg` } as React.CSSProperties} key={course.examCode}>
                <div className="study-course-card-top"><span>{course.examCode}</span><span>Blueprint {course.blueprintVersion}</span></div>
                <div className="study-course-card-main">
                  <div><h2>{course.shortTitle}</h2><p>{course.description}</p></div>
                  <div className="study-course-readiness" aria-label={`${readiness}% objective readiness`}><span><strong>{readiness}%</strong><small>ready</small></span></div>
                </div>
                <div className="study-course-metrics"><span><Target size={15} /> {readyObjectives}/{course.pages.length} objectives ready</span><span><CheckCircle2 size={15} /> {reviewed} guides reviewed</span><span><BookOpenText size={15} /> {bookmarks} saved</span></div>
                <div className="study-course-next"><Sparkles size={18} /><span><small>Recommended next</small><strong>{recommendation.title}</strong></span></div>
                <footer><button className="secondary-button" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}/drill`)}>Build a drill</button><button className="primary-button" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}`)}>Open study plan <ArrowRight size={17} /></button></footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
