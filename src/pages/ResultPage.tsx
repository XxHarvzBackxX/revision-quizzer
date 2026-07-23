import { AlertCircle, ArrowRight, BookOpenText, Check, ChevronDown, Clock3, ExternalLink, Flag, Flame, Gamepad2, RotateCcw, Star, Target, Trophy, X } from 'lucide-react';
import { useState } from 'react';
import type { PublicDataset } from '../../shared/quiz';
import { getCorrectAnswers } from '../../shared/quiz';
import type { AttemptRecord } from '../storage';
import type { Navigate } from '../types';
import { getCoursePath, revisionPathForObjective } from '../revision/registry';
import { QuestionStudyTools } from '../study/components/QuestionStudyTools';
import { beginStudyDrill } from '../study/storage';
import { retryConfigFromAttempt } from '../study/pool';
import { studyStreak, studyTotals, useStudyState } from '../study/storage';
import { useOptionalAccount } from '../account/AccountContext';
import { PlayerIdentity } from '../account/PlayerIdentity';

export function ResultPage({ dataset, attempt, navigate, studyExamCode }: { dataset: PublicDataset; attempt?: AttemptRecord; navigate: Navigate; studyExamCode?: string }) {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');
  const [expanded, setExpanded] = useState<number[]>([]);
  const study = useStudyState();
  const account = useOptionalAccount();

  if (!attempt) {
    return (
      <section className="result-empty">
        <AlertCircle size={38} />
        <h1>Attempt not found</h1>
        <p>This result may have been cleared from this browser.</p>
        <button className="primary-button" onClick={() => navigate(`/quiz/${dataset.slug}`)}>Back to exam</button>
      </section>
    );
  }

  const metTarget = attempt.percentage >= attempt.readinessTarget;
  const visibleAnswers = attempt.answers.filter((answer) => (
    filter === 'all' || (filter === 'incorrect' && !answer.correct) || (filter === 'flagged' && answer.flagged)
  ));
  const missedIndexes = attempt.answers.filter((answer) => !answer.correct).map((answer) => answer.questionIndex);
  const coursePath = getCoursePath(dataset.examCode);
  const academyChallenge = attempt.academyChallenge;

  function retryMissed() {
    if (studyExamCode) {
      const config = retryConfigFromAttempt(studyExamCode, attempt!);
      if (config) beginStudyDrill(config);
      navigate(`/study/${studyExamCode.toLowerCase()}/drill/play`);
      return;
    }
    try {
      sessionStorage.setItem(`quiz-arcade:retry:${dataset.id}`, JSON.stringify(missedIndexes));
    } catch {
      // The next practice run will simply include the full set.
    }
    navigate(`/quiz/${dataset.slug}/practice`);
  }

  return (
    <section className="results-page">
      <div className="results-hero">
        <div className={`result-orb ${metTarget ? 'pass' : 'review'}`}><strong>{attempt.percentage}%</strong><span>{metTarget ? 'Target met' : 'Keep learning'}</span></div>
        <div className="result-summary-copy">
          <PlayerIdentity account={account} label="Result saved to your profile" actionLabel="View profile" className="result-player-identity" tone="inverse" onOpen={() => navigate('/study/profile')} />
          <span className="result-kicker"><Trophy size={17} /> {academyChallenge ? academyChallenge.kind === 'final-boss' ? 'Final boss complete' : 'Domain boss complete' : attempt.mode === 'exam' ? 'Mock exam complete' : 'Practice complete'}</span>
          <h1>{metTarget ? 'Strong work.' : 'You have a clear next step.'}</h1>
          <p>{attempt.score} of {attempt.total} correct on {dataset.title}. This is an unofficial readiness estimate, not Microsoft’s scaled certification score.</p>
          <div className="result-study-reward"><span><Flame size={15} /> {studyStreak(study).current}-day streak</span><span><Star size={15} /> Level {studyTotals(study).level}</span></div>
          <div className="result-actions">
            {missedIndexes.length > 0 && <button className="primary-button" onClick={retryMissed}><RotateCcw size={17} /> Practice {missedIndexes.length} missed</button>}
            <button className="secondary-button" onClick={() => navigate(academyChallenge && studyExamCode ? `/study/${studyExamCode.toLowerCase()}/academy` : studyExamCode ? `/study/${studyExamCode.toLowerCase()}` : `/quiz/${dataset.slug}`)}>{academyChallenge ? 'Campaign map' : studyExamCode ? 'Continue study plan' : 'Exam overview'} <ArrowRight size={17} /></button>
            {studyExamCode && !academyChallenge && <button className="secondary-button" onClick={() => navigate(`/study/${studyExamCode.toLowerCase()}/academy`)}><Gamepad2 size={17} /> See campaign progress</button>}
            {coursePath && <button className="secondary-button" onClick={() => navigate(coursePath)}><BookOpenText size={17} /> Open RevisionWiki</button>}
            {!studyExamCode && dataset.examCode && <button className="secondary-button" onClick={() => navigate(`/study/${dataset.examCode!.toLowerCase()}`)}><Gamepad2 size={17} /> Smart study plan</button>}
          </div>
        </div>
      </div>

      <div className="result-metrics">
        <Metric icon={<Target size={20} />} label="Readiness target" value={`${attempt.readinessTarget}%`} />
        <Metric icon={<Clock3 size={20} />} label="Time used" value={formatDuration(attempt.durationSeconds)} />
        <Metric icon={<Flag size={20} />} label="Flagged" value={String(attempt.answers.filter((answer) => answer.flagged).length)} />
        <Metric icon={<AlertCircle size={20} />} label="Unanswered" value={String(attempt.answers.filter((answer) => answer.response.filter(Boolean).length === 0).length)} />
      </div>

      {attempt.domains.length > 0 && (
        <section className="domain-breakdown">
          <div className="section-heading"><div><span className="section-kicker">Blueprint performance</span><h2>Results by domain</h2></div><p>Use this to choose what to revise next.</p></div>
          <div className="domain-result-list">
            {attempt.domains.map((domain) => {
              const percent = domain.total ? Math.round((domain.correct / domain.total) * 100) : 0;
              const objectiveScores = attempt.answers.filter((answer) => answer.domainId === domain.domainId && answer.objectiveId).reduce<Record<string, { correct: number; total: number }>>((scores, answer) => {
                const id = answer.objectiveId as string;
                const current = scores[id] ?? { correct: 0, total: 0 };
                scores[id] = { correct: current.correct + (answer.correct ? 1 : 0), total: current.total + 1 };
                return scores;
              }, {});
              const weakestObjective = Object.entries(objectiveScores).sort((left, right) => (left[1].correct / left[1].total) - (right[1].correct / right[1].total))[0]?.[0];
              const revisionPath = revisionPathForObjective(dataset.examCode, weakestObjective);
              return (
                <div className="domain-result" key={domain.domainId}>
                  <div><strong>{dataset.domains?.find((item) => item.id === domain.domainId)?.title ?? humanize(domain.domainId)}</strong><span>{domain.correct}/{domain.total} correct</span>{revisionPath && <button className="domain-revision-link" onClick={() => navigate(revisionPath)}>Revise weakest topic <ArrowRight size={13} /></button>}</div>
                  <div className="domain-bar"><span style={{ width: `${percent}%` }} /></div>
                  <strong>{percent}%</strong>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="answer-review">
        <div className="review-heading">
          <div><span className="section-kicker">Answer review</span><h2>Learn from every question</h2></div>
          <div className="review-filters">
            {(['all', 'incorrect', 'flagged'] as const).map((value) => <button className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} key={value}>{humanize(value)}</button>)}
          </div>
        </div>
        <div className="review-list">
          {visibleAnswers.map((answer) => {
            const item = resolveAttemptItem(dataset, answer);
            if (!item) return null;
            const isOpen = expanded.includes(answer.questionIndex);
            const revisionPath = revisionPathForObjective(dataset.examCode, item.objectiveId);
            return (
              <article className="review-item" key={item.id ?? answer.questionIndex}>
                <button className="review-item-heading" onClick={() => setExpanded((current) => current.includes(answer.questionIndex) ? current.filter((index) => index !== answer.questionIndex) : [...current, answer.questionIndex])}>
                  <span className={answer.correct ? 'review-status correct' : 'review-status wrong'}>{answer.correct ? <Check size={17} /> : <X size={17} />}</span>
                  <span><small>Question {answer.questionIndex + 1}</small><strong>{reviewPrompt(item)}</strong></span>
                  {answer.flagged && <Flag size={16} fill="currentColor" />}
                  <ChevronDown className={isOpen ? 'rotated' : ''} size={19} />
                </button>
                {isOpen && (
                  <div className="review-detail">
                    <div className="answer-comparison">
                      <div><span>Your answer{answer.confidence ? ` · ${humanize(answer.confidence)}` : ''}</span><strong>{formatReviewResponse(item, answer.response)}</strong></div>
                      <div><span>Correct answer</span><strong>{formatReviewResponse(item, getCorrectAnswers(item))}</strong></div>
                    </div>
                    {item.type === 'statement-group' && <div className="statement-review-list">{item.statements.map((statement, statementIndex) => <p key={statement.text}><strong>{statementIndex + 1}.</strong> {statement.text}</p>)}</div>}
                    <h3>Explanation</h3>
                    <p>{item.explanation || 'No extended explanation was supplied for this community question.'}</p>
                    <QuestionStudyTools dataset={dataset} item={item} questionIndex={answer.questionIndex} />
                    <div className="review-meta">{item.objectiveId && <span>{humanize(item.objectiveId)}</span>}{item.difficulty && <span>{humanize(item.difficulty)}</span>}</div>
                    {revisionPath && <button className="review-revision-link" onClick={() => navigate(revisionPath)}><BookOpenText size={14} /> Revise this objective</button>}
                    {(item.references ?? []).map((reference) => <a href={reference.url} target="_blank" rel="noreferrer" key={reference.url}>{reference.title} <ExternalLink size={14} /></a>)}
                  </div>
                )}
              </article>
            );
          })}
          {visibleAnswers.length === 0 && <div className="empty-inline">No questions match this filter.</div>}
        </div>
      </section>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="result-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function formatDuration(seconds: number): string {
  if (!seconds) return 'Not recorded';
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function humanize(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveAttemptItem(dataset: PublicDataset, answer: AttemptRecord['answers'][number]) {
  return dataset.items.find((item) => (
    answer.sourceDatasetId
      ? item.sourceDatasetId === answer.sourceDatasetId && item.sourceQuestionId === (answer.sourceQuestionId ?? answer.questionId)
      : item.id === answer.questionId
  )) ?? dataset.items[answer.questionIndex];
}

function reviewPrompt(item: PublicDataset['items'][number]): string {
  return item.type === 'dropdown' ? item.prompt.replace('{{blank}}', '_____') : item.prompt;
}

function formatReviewResponse(item: PublicDataset['items'][number], response: string[]): string {
  const answers = response.map((value, index) => value ? item.type === 'statement-group' ? `${index + 1}. ${value}` : value : '').filter(Boolean);
  return answers.join(' · ') || 'No answer';
}
