import { AlertTriangle, ArrowRight, BookOpenText, BrainCircuit, CheckCircle2, Flame, Gamepad2, Gauge, Settings2, Sparkles, Star, Target, Trophy } from 'lucide-react';
import type { DatasetSummary } from '../../shared/quiz';
import { getRevisionCourse, revisionPathForObjective } from '../revision/registry';
import { revisionPageKey, useRevisionState } from '../revision/storage';
import { getActiveExamSession, type AttemptRecord } from '../storage';
import { calculateCertificationMastery, certificationReadiness, selectStudyRecommendation } from '../study/mastery';
import { localDateKey, studyStreak, studyTotals, updateStudySettings, useStudyState } from '../study/storage';
import type { Navigate } from '../types';
import { studyDatasetId } from '../study/pool';

export function StudyHubPage({ examCode, datasets, attempts, navigate }: {
  examCode: string;
  datasets: DatasetSummary[];
  attempts: AttemptRecord[];
  navigate: Navigate;
}) {
  const course = getRevisionCourse(examCode);
  const study = useStudyState();
  const revision = useRevisionState();
  if (!course) return <StudyNotFound navigate={navigate} />;
  const activeCourse = course;

  const mastery = calculateCertificationMastery({ examCode: activeCourse.examCode, attempts, datasets, course: activeCourse });
  const recommendation = selectStudyRecommendation(mastery);
  const readiness = certificationReadiness(mastery);
  const streak = studyStreak(study);
  const totals = studyTotals(study);
  const today = study.activity[localDateKey()];
  const reviewed = activeCourse.pages.filter((page) => revision.reviewedPages[revisionPageKey(activeCourse.examCode, page.id)]).length;
  const bookmarks = Object.values(study.bookmarks).filter((bookmark) => bookmark.examCode === activeCourse.examCode);
  const examAttempts = attempts.filter((attempt) => attempt.mode === 'exam' && attemptBelongsToCourse(attempt, activeCourse.examCode, datasets));
  const trend = [...examAttempts].slice(0, 6).reverse();
  const activeDrill = study.activeDrills[activeCourse.examCode];
  const canResumeDrill = Boolean(activeDrill && getActiveExamSession(studyDatasetId(activeCourse.examCode, activeDrill.seed)));

  function openRecommendation() {
    if (recommendation.kind === 'revision' && recommendation.objectiveId) {
      navigate(revisionPathForObjective(activeCourse.examCode, recommendation.objectiveId) ?? `/wiki/${activeCourse.examCode.toLowerCase()}`);
    } else if (recommendation.kind === 'drill') {
      const query = recommendation.objectiveId ? `?objective=${encodeURIComponent(recommendation.objectiveId)}` : '';
      navigate(`/study/${activeCourse.examCode.toLowerCase()}/drill${query}`);
    } else navigate('/gallery');
  }

  return (
    <section className="study-hub-page" style={{ '--course-accent': course.accent } as React.CSSProperties}>
      <header className="study-hub-hero">
        <div>
          <span className="study-kicker"><Gamepad2 size={16} /> {course.examCode} Study Arcade</span>
          <h1>Know what to do <em>next.</em></h1>
          <p>Your mocks, confidence, and RevisionWiki activity combine into one focused plan.</p>
          <div className="study-hero-actions">
            <button className="primary-button large" onClick={openRecommendation}>{recommendation.title} <ArrowRight size={18} /></button>
            {canResumeDrill && <button className="secondary-button large" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}/drill/play`)}><Gamepad2 size={18} /> Resume drill</button>}
            <button className="secondary-button large" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}/drill`)}><Target size={18} /> Build a drill</button>
          </div>
        </div>
        <div className="study-readiness-orb" aria-label={`${readiness}% readiness`}><strong>{readiness}%</strong><span>objective readiness</span></div>
      </header>

      <div className="study-stat-grid">
        <article><Flame size={22} /><span>Current streak</span><strong>{streak.current} day{streak.current === 1 ? '' : 's'}</strong><small>Longest: {streak.longest}</small></article>
        <article><Star size={22} /><span>Arcade level</span><strong>Level {totals.level}</strong><small>{totals.levelProgress}/500 XP to next</small></article>
        <article><CheckCircle2 size={22} /><span>RevisionWiki</span><strong>{reviewed}/{course.pages.length}</strong><small>guides reviewed</small></article>
        <article><Trophy size={22} /><span>Mock exams</span><strong>{examAttempts.length}</strong><small>{examAttempts[0] ? `Latest ${examAttempts[0].percentage}%` : 'No result yet'}</small></article>
      </div>

      <section className="next-action-card">
        <div className="next-action-icon"><Sparkles size={25} /></div>
        <div><span>Next best action</span><h2>{recommendation.title}</h2><p>{recommendation.description}</p></div>
        <button className="primary-button" onClick={openRecommendation}>Start now <ArrowRight size={17} /></button>
      </section>

      <div className="study-dashboard-grid">
        <section className="mastery-panel">
          <header><div><span className="section-kicker">Objective mastery</span><h2>Your knowledge map</h2></div><Gauge size={24} /></header>
          <div className="mastery-list">
            {mastery.map((objective) => (
              <article className={`mastery-row status-${objective.status}`} key={objective.objectiveId}>
                <button onClick={() => navigate(revisionPathForObjective(course.examCode, objective.objectiveId) ?? `/wiki/${course.examCode.toLowerCase()}`)}>
                  <span><strong>{objective.title}</strong><small>{objective.domainTitle} · {objective.evidence} answer{objective.evidence === 1 ? '' : 's'}{objective.confidentWrong ? ` · ${objective.confidentWrong} confident miss${objective.confidentWrong === 1 ? '' : 'es'}` : ''}</small></span>
                  <span className="mastery-status">{statusLabel(objective.status)}</span>
                </button>
                <div><span style={{ width: `${objective.evidence ? objective.score : 3}%` }} /></div>
                <strong>{objective.evidence ? `${objective.score}%` : '—'}</strong>
              </article>
            ))}
          </div>
        </section>

        <aside className="study-side-stack">
          <section className="study-panel daily-goal-panel">
            <header><div><span className="section-kicker">Today</span><h2>{streak.completedToday ? 'Goal complete!' : 'Keep the flame alive'}</h2></div><Flame size={23} /></header>
            <p>{today?.questionsAnswered ?? 0} of {study.settings.dailyQuestionGoal} questions · {today?.xp ?? 0} XP today</p>
            <div className="daily-goal-bar"><span style={{ width: `${Math.min(100, (today?.questionsAnswered ?? 0) / study.settings.dailyQuestionGoal * 100)}%` }} /></div>
            <label><Settings2 size={15} /> Daily question target<select value={study.settings.dailyQuestionGoal} onChange={(event) => updateStudySettings({ dailyQuestionGoal: Number(event.target.value) as 5 | 10 | 20 | 30 })}>{[5, 10, 20, 30].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
            <label className="study-toggle"><input type="checkbox" checked={study.settings.showExamConfidence} onChange={(event) => updateStudySettings({ showExamConfidence: event.target.checked })} /><span /> Confidence controls in timed exams</label>
          </section>

          <section className="study-panel score-trend-panel">
            <header><div><span className="section-kicker">Timed mocks</span><h2>Score trend</h2></div><BrainCircuit size={23} /></header>
            {trend.length ? <div className="score-sparkline">{trend.map((attempt) => <div key={attempt.id}><span style={{ height: `${Math.max(8, attempt.percentage)}%` }} /><small>{attempt.percentage}%</small></div>)}</div> : <p>Complete a timed paper to start your trend.</p>}
          </section>

          <section className="study-panel saved-panel">
            <header><div><span className="section-kicker">Question bank</span><h2>{bookmarks.length} saved</h2></div><Target size={23} /></header>
            {bookmarks.slice(0, 3).map((bookmark) => <p key={bookmark.key}><strong>{bookmark.prompt}</strong>{bookmark.note && <small>{bookmark.note}</small>}</p>)}
            <button className="text-button" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}/drill?filter=bookmarked`)}>Practice bookmarks <ArrowRight size={15} /></button>
          </section>

          {mastery.some((objective) => objective.confidentWrong > 0) && <section className="study-panel confidence-traps-panel">
            <header><div><span className="section-kicker">Misconceptions</span><h2>Confidence traps</h2></div><AlertTriangle size={23} /></header>
            <p>These objectives contain answers you felt sure about but missed.</p>
            {mastery.filter((objective) => objective.confidentWrong > 0).sort((left, right) => right.confidentWrong - left.confidentWrong).map((objective) => <button onClick={() => navigate(revisionPathForObjective(course.examCode, objective.objectiveId) ?? `/wiki/${course.examCode.toLowerCase()}`)} key={objective.objectiveId}><span><strong>{objective.title}</strong><small>{objective.confidentWrong} confident miss{objective.confidentWrong === 1 ? '' : 'es'}</small></span><ArrowRight size={15} /></button>)}
          </section>}
        </aside>
      </div>

      <footer className="study-hub-footer"><button onClick={() => navigate(`/wiki/${course.examCode.toLowerCase()}`)}><BookOpenText size={17} /> Open {course.examCode} RevisionWiki</button><button onClick={() => navigate('/gallery')}><Trophy size={17} /> Choose a mock paper</button></footer>
    </section>
  );
}

function attemptBelongsToCourse(attempt: AttemptRecord, examCode: string, datasets: DatasetSummary[]): boolean {
  return (attempt.examCode ?? datasets.find((dataset) => dataset.id === attempt.datasetId)?.examCode)?.toUpperCase() === examCode.toUpperCase();
}

function statusLabel(status: string): string {
  return ({ unseen: 'Unseen', building: 'Building', 'needs-work': 'Needs work', developing: 'Developing', ready: 'Ready' } as Record<string, string>)[status] ?? status;
}

function StudyNotFound({ navigate }: { navigate: Navigate }) {
  return <section className="result-empty"><Target size={38} /><h1>Study plan unavailable</h1><p>This certification does not have a mapped RevisionWiki course yet.</p><button className="primary-button" onClick={() => navigate('/gallery')}>Browse certifications</button></section>;
}
