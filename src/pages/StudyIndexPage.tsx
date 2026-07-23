import { ArrowRight, BookOpenText, BrainCircuit, CheckCircle2, Flame, Gamepad2, RefreshCcw, Shield, Sparkles, Star, Target, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import type { DatasetSummary } from '../../shared/quiz';
import { revisionCourses } from '../revision/registry';
import { revisionPageKey, useRevisionState } from '../revision/storage';
import type { AttemptRecord } from '../storage';
import { academyTitleLabel, buildAcademyCampaign } from '../study/academy';
import { calculateCertificationMastery, certificationReadiness, selectStudyRecommendation } from '../study/mastery';
import { ensureAcademyQuests, getActiveAcademyQuests, studyStreak, studyTotals, useStudyState } from '../study/storage';
import type { Navigate } from '../types';
import { isReviewDue, useReviewState } from '../review/storage';

export function StudyIndexPage({ datasets, attempts, navigate }: {
  datasets: DatasetSummary[];
  attempts: AttemptRecord[];
  navigate: Navigate;
}) {
  const study = useStudyState();
  const revision = useRevisionState();
  const review = useReviewState();
  const streak = studyStreak(study);
  const totals = studyTotals(study);
  const activeQuests = revisionCourses.flatMap((course) => getActiveAcademyQuests(study, course.examCode));
  const playerTitle = academyTitleLabel(study.academy.inventory.equippedTitle);
  const dueMistakes = Object.values(review.records).filter((record) => isReviewDue(record)).length;
  const recoveredMistakes = Object.values(review.records).filter((record) => record.correctStreak >= 2).length;

  useEffect(() => {
    for (const course of revisionCourses) {
      const mastery = calculateCertificationMastery({ examCode: course.examCode, attempts, datasets, course });
      const weak = [...mastery].filter((item) => item.status !== 'ready').sort((left, right) => left.score - right.score)[0];
      const reviewed = course.pages.filter((page) => revision.reviewedPages[revisionPageKey(course.examCode, page.id)]).length;
      ensureAcademyQuests({
        examCode: course.examCode,
        weakObjectiveId: weak?.objectiveId,
        weakObjectiveTitle: weak?.title,
        unreviewedGuideCount: course.pages.length - reviewed,
        bookmarkCount: Object.values(study.bookmarks).filter((bookmark) => bookmark.examCode === course.examCode).length
      });
    }
  }, [attempts, datasets, revision.reviewedPages, study.bookmarks]);

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
          <div className="study-index-player-title"><UserRound size={16} /><span><small>Equipped title</small><strong>{playerTitle}</strong></span></div>
          <div className="study-index-streak"><Flame size={20} /><span><strong>{streak.current} day{streak.current === 1 ? '' : 's'}</strong><small>current streak · longest {streak.longest}</small></span></div>
          <div className="study-index-academy-status"><span><Sparkles size={15} /> {activeQuests.filter((quest) => quest.completedAt && !quest.claimedAt).length} quests to claim</span><span><Shield size={15} /> {study.academy.inventory.streakShields}</span><span><RefreshCcw size={15} /> {study.academy.inventory.rerolls}</span></div>
          <button className="study-profile-link" onClick={() => navigate('/study/profile')}><UserRound size={16} /> Player profile</button>
        </div>
      </header>

      <div className="study-index-content">
        <section className="study-mistake-banner">
          <span className="study-mistake-icon"><BrainCircuit size={25} /></span>
          <div><span className="section-kicker">Mistake review</span><h2>{dueMistakes ? `${dueMistakes} question${dueMistakes === 1 ? '' : 's'} ready to revisit` : 'Your recovery queue is clear'}</h2><p>Two spaced correct answers recover a mistake. {recoveredMistakes} recovered so far.</p></div>
          <button className={dueMistakes ? 'primary-button' : 'secondary-button'} onClick={() => navigate('/study/mistakes')}>Open notebook <ArrowRight size={17} /></button>
        </section>
        <header><div><span className="section-kicker">Certification hubs</span><h2>Where are you heading?</h2></div><p>Progress stays privately in this browser.</p></header>
        <div className="study-course-grid">
          {revisionCourses.map((course) => {
            const mastery = calculateCertificationMastery({ examCode: course.examCode, attempts, datasets, course });
            const readiness = certificationReadiness(mastery);
            const recommendation = selectStudyRecommendation(mastery);
            const reviewed = course.pages.filter((page) => revision.reviewedPages[revisionPageKey(course.examCode, page.id)]).length;
            const bookmarks = Object.values(study.bookmarks).filter((bookmark) => bookmark.examCode === course.examCode).length;
            const readyObjectives = mastery.filter((objective) => objective.status === 'ready').length;
            const reviewedPageIds = new Set(course.pages.filter((page) => revision.reviewedPages[revisionPageKey(course.examCode, page.id)]).map((page) => page.id));
            const campaign = buildAcademyCampaign({ course, mastery, reviewedPageIds, challenges: study.academy.challenges });
            const courseQuests = getActiveAcademyQuests(study, course.examCode);
            const claimableQuests = courseQuests.filter((quest) => quest.completedAt && !quest.claimedAt).length;
            return (
              <article className="study-course-card" style={{ '--course-accent': course.accent, '--readiness': `${readiness * 3.6}deg` } as React.CSSProperties} key={course.examCode}>
                <div className="study-course-card-top"><span>{course.examCode}</span><span>Blueprint {course.blueprintVersion}</span></div>
                <div className="study-course-card-main">
                  <div><h2>{course.shortTitle}</h2><p>{course.description}</p></div>
                  <div className="study-course-readiness" aria-label={`${readiness}% objective readiness`}><span><strong>{readiness}%</strong><small>ready</small></span></div>
                </div>
                <div className="study-course-metrics"><span><Target size={15} /> {readyObjectives}/{course.pages.length} objectives ready</span><span><Star size={15} /> {campaign.earnedStars}/{campaign.totalStars} campaign stars</span><span><CheckCircle2 size={15} /> {reviewed} guides reviewed</span><span><BookOpenText size={15} /> {bookmarks} saved</span></div>
                <div className="study-course-next"><Sparkles size={18} /><span><small>Recommended next</small><strong>{recommendation.title}</strong></span></div>
                <footer><button className="secondary-button" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}/academy`)}><Gamepad2 size={16} /> Campaign map{claimableQuests ? ` · ${claimableQuests} to claim` : ''}</button><button className="primary-button" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}`)}>Continue journey <ArrowRight size={17} /></button></footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
