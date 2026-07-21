import { AlertTriangle, Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flag, Menu, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PublicDataset } from '../../shared/quiz';
import { isObjectiveItem, isResponseComplete } from '../../shared/quiz';
import { formatQuestionType, QuestionPrompt, QuestionResponseControls } from '../components/QuestionResponse';
import {
  clearActiveExamSession,
  getActiveExamSession,
  saveActiveExamSession,
  type ActiveExamSession,
  type AttemptRecord
} from '../storage';
import type { Navigate } from '../types';
import { buildAttempt, createExamSession, formatRemainingTime, getOrderedQuestions } from '../utils/exam';
import { QuestionStudyTools } from '../study/components/QuestionStudyTools';
import { StudyConfidencePicker } from '../study/components/StudyConfidencePicker';
import { recordAcademyChallenge, recordExamActivity, useStudyState } from '../study/storage';
import type { StudyDrillConfig } from '../study/types';
import type { StudyConfidence } from '../storage';

export function ExamPage({
  dataset,
  navigate,
  onAttempt,
  studyExamCode,
  studyConfig
}: {
  dataset: PublicDataset;
  navigate: Navigate;
  onAttempt: (attempt: AttemptRecord) => void;
  studyExamCode?: string;
  studyConfig?: StudyDrillConfig;
}) {
  const [session, setSession] = useState<ActiveExamSession>(() => getActiveExamSession(dataset.id, dataset.contentRevision) ?? createExamSession(dataset));
  const [now, setNow] = useState(Date.now());
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const submitted = useRef(false);
  const study = useStudyState();
  const questions = useMemo(() => getOrderedQuestions(dataset, session), [dataset, session.itemOrder, session.optionOrders]);
  const current = questions[session.currentIndex] ?? questions[0];
  const remaining = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - now) / 1000));
  const answeredCount = questions.filter((question) => isResponseComplete(question.item, session.answers[String(question.originalIndex)] ?? [])).length;
  const unansweredCount = questions.length - answeredCount;

  useEffect(() => {
    saveActiveExamSession(session);
  }, [session]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0) finish(true);
  }, [remaining]);

  function updateResponse(response: string[]) {
    if (!current || !isObjectiveItem(current.item)) return;
    setSession((existing) => {
      const key = String(current.originalIndex);
      return { ...existing, answers: { ...existing.answers, [key]: response } };
    });
  }

  function goTo(index: number) {
    setSession((existing) => ({ ...existing, currentIndex: Math.max(0, Math.min(index, questions.length - 1)) }));
    setShowNavigator(false);
  }

  function toggleFlag() {
    if (!current) return;
    setSession((existing) => ({
      ...existing,
      flags: existing.flags.includes(current.originalIndex)
        ? existing.flags.filter((index) => index !== current.originalIndex)
        : [...existing.flags, current.originalIndex]
    }));
  }

  function updateConfidence(confidence: StudyConfidence) {
    if (!current) return;
    setSession((existing) => ({ ...existing, confidence: { ...existing.confidence, [String(current.originalIndex)]: confidence } }));
  }

  function finish(expired = false) {
    if (submitted.current) return;
    submitted.current = true;
    const attempt = buildAttempt({ dataset, mode: 'exam', session, expired });
    const completed: AttemptRecord = studyExamCode ? {
      ...attempt,
      studyDrill: true,
      examCode: studyExamCode,
      ...(studyConfig?.challengeId && (studyConfig.mode === 'domain-boss' || studyConfig.mode === 'final-boss') ? {
        academyChallenge: {
          challengeId: studyConfig.challengeId,
          kind: studyConfig.mode,
          ...(studyConfig.domainId ? { domainId: studyConfig.domainId } : {})
        }
      } : {})
    } : attempt;
    recordExamActivity(completed.answers, { examCode: studyExamCode ?? dataset.examCode });
    if (studyConfig?.challengeId) recordAcademyChallenge(completed, studyConfig);
    clearActiveExamSession(dataset.id);
    onAttempt(completed);
    navigate(studyExamCode ? `/study/${studyExamCode.toLowerCase()}/drill/results/${attempt.id}` : `/quiz/${dataset.slug}/results/${attempt.id}`);
  }

  if (!current) return null;
  const selected = session.answers[String(current.originalIndex)] ?? [];
  const isFlagged = session.flags.includes(current.originalIndex);

  return (
    <section className="exam-shell">
      <header className="exam-header">
        <button className="quiet-button" onClick={() => navigate(studyExamCode ? `/study/${studyExamCode.toLowerCase()}/academy` : `/quiz/${dataset.slug}`)}><ChevronLeft size={17} /> Save & exit</button>
        <div className="exam-title"><span>{dataset.examCode ?? 'Mock exam'}</span><strong>{dataset.title}</strong></div>
        <div className={`exam-timer ${remaining <= 300 ? 'urgent' : ''}`} aria-live="polite"><Clock3 size={18} /> {formatRemainingTime(remaining)}</div>
      </header>

      <div className="exam-layout">
        <aside className={`question-navigator ${showNavigator ? 'open' : ''}`} aria-label="Question navigator">
          <div className="navigator-heading">
            <div><strong>Questions</strong><span>{answeredCount} of {questions.length} answered</span></div>
            <button className="icon-plain mobile-only" onClick={() => setShowNavigator(false)} aria-label="Close navigator"><X size={18} /></button>
          </div>
          <div className="question-grid">
            {questions.map((question, index) => {
              const answered = isResponseComplete(question.item, session.answers[String(question.originalIndex)] ?? []);
              const flagged = session.flags.includes(question.originalIndex);
              return (
                <button
                  className={`${index === session.currentIndex ? 'current ' : ''}${answered ? 'answered ' : ''}${flagged ? 'flagged' : ''}`}
                  key={question.item.id ?? question.originalIndex}
                  onClick={() => goTo(index)}
                  aria-label={`Question ${index + 1}${answered ? ', answered' : ''}${flagged ? ', flagged' : ''}`}
                >
                  {index + 1}{flagged && <span aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="navigator-legend"><span><i className="answered" /> Answered</span><span><i className="flagged" /> Flagged</span></div>
          <button className="submit-exam-button" onClick={() => setShowSubmit(true)}><Send size={17} /> Review & submit</button>
        </aside>

        <main className="exam-question-panel">
          <div className="exam-question-toolbar">
            <button className="quiet-button mobile-only" onClick={() => setShowNavigator(true)}><Menu size={18} /> Questions</button>
            <span>Question {session.currentIndex + 1} of {questions.length}</span>
            <button className={isFlagged ? 'flag-button active' : 'flag-button'} onClick={toggleFlag}>
              <Flag size={17} fill={isFlagged ? 'currentColor' : 'none'} /> {isFlagged ? 'Flagged' : 'Flag for review'}
            </button>
          </div>
          <article className="exam-question-card">
            <div className="question-context">
              <span>{formatQuestionType(current.item)}</span>
              {current.item.domainId && <span>{domainTitle(dataset, current.item.domainId)}</span>}
            </div>
            <QuestionPrompt item={current.item} options={current.options} response={selected} appearance="exam" onChange={updateResponse} />
            <QuestionStudyTools dataset={dataset} item={current.item} questionIndex={current.originalIndex} />
            {study.settings.showExamConfidence && <StudyConfidencePicker value={session.confidence?.[String(current.originalIndex)]} onChange={updateConfidence} />}
            {isObjectiveItem(current.item) && <QuestionResponseControls item={current.item} options={current.options} response={selected} appearance="exam" questionKey={`question-${current.originalIndex}`} onChange={updateResponse} />}
          </article>
          <footer className="exam-question-footer">
            <button className="secondary-button" disabled={session.currentIndex === 0} onClick={() => goTo(session.currentIndex - 1)}><ChevronLeft size={18} /> Previous</button>
            {session.currentIndex < questions.length - 1 ? (
              <button className="primary-button" onClick={() => goTo(session.currentIndex + 1)}>Next <ChevronRight size={18} /></button>
            ) : (
              <button className="primary-button" onClick={() => setShowSubmit(true)}>Review exam <ChevronRight size={18} /></button>
            )}
          </footer>
        </main>
      </div>

      {showSubmit && (
        <div className="modal-backdrop" role="presentation">
          <div className="submit-dialog" role="dialog" aria-modal="true" aria-labelledby="submit-title">
            <button className="dialog-close" onClick={() => setShowSubmit(false)} aria-label="Close"><X size={20} /></button>
            <div className="dialog-icon">{unansweredCount ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}</div>
            <h2 id="submit-title">Ready to submit?</h2>
            <p>Your answers cannot be changed after submission.</p>
            <div className="submit-summary">
              <span><CheckCircle2 size={18} /> {answeredCount} answered</span>
              <span><Bookmark size={18} /> {session.flags.length} flagged</span>
              <span className={unansweredCount ? 'warning' : ''}><AlertTriangle size={18} /> {unansweredCount} unanswered</span>
            </div>
            {unansweredCount > 0 && <button className="secondary-button full" onClick={() => { const first = questions.findIndex((question) => !isResponseComplete(question.item, session.answers[String(question.originalIndex)] ?? [])); setShowSubmit(false); goTo(first); }}>Return to unanswered</button>}
            <button className="submit-exam-button full" onClick={() => finish(false)}>Submit exam</button>
          </div>
        </div>
      )}
    </section>
  );
}

function domainTitle(dataset: PublicDataset, id: string): string {
  return dataset.domains?.find((domain) => domain.id === id)?.title ?? id;
}
