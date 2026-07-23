import type { DatasetSummary } from '../../shared/quiz';
import type { RevisionCourse } from '../revision/types';
import type { AttemptRecord, StudyConfidence } from '../storage';
import type { ObjectiveMastery, StudyRecommendation } from './types';

const HALF_LIFE_DAYS = 45;
const MAX_EVIDENCE_PER_OBJECTIVE = 30;

export function calculateCertificationMastery({
  examCode,
  attempts,
  datasets,
  course,
  now = new Date()
}: {
  examCode: string;
  attempts: AttemptRecord[];
  datasets: DatasetSummary[];
  course: RevisionCourse;
  now?: Date;
}): ObjectiveMastery[] {
  const datasetCodes = new Map(datasets.map((dataset) => [dataset.id, dataset.examCode?.toUpperCase()]));
  const matching = attempts.filter((attempt) => (
    (attempt.examCode ?? datasetCodes.get(attempt.datasetId))?.toUpperCase() === examCode.toUpperCase()
    || attempt.answers.some((answer) => answer.sourceExamCode?.toUpperCase() === examCode.toUpperCase())
  ));

  return course.pages.map((page) => {
    const domain = course.domains.find((item) => item.id === page.domainId);
    const objectivesInDomain = course.pages.filter((item) => item.domainId === page.domainId).length;
    const evidence = matching.flatMap((attempt) => (Array.isArray(attempt.answers) ? attempt.answers : [])
      .filter((answer) => answer.objectiveId === page.objectiveId && (!answer.sourceExamCode || answer.sourceExamCode.toUpperCase() === examCode.toUpperCase()))
      .map((answer) => ({ answer, attempt })))
      .sort((left, right) => right.attempt.completedAt.localeCompare(left.attempt.completedAt))
      .slice(0, MAX_EVIDENCE_PER_OBJECTIVE);
    let correctWeight = 0;
    let totalWeight = 0;
    let confidentWrong = 0;
    for (const item of evidence) {
      const completedAt = Date.parse(item.attempt.completedAt);
      const ageDays = Number.isFinite(completedAt) ? Math.max(0, (now.getTime() - completedAt) / 86_400_000) : 0;
      const recencyWeight = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
      const modeWeight = item.attempt.mode === 'exam' ? 1.25 : 1;
      const confidenceWeight = confidenceEvidenceWeight(item.answer.confidence, item.answer.correct);
      const weight = recencyWeight * modeWeight * confidenceWeight;
      totalWeight += weight;
      if (item.answer.correct) correctWeight += weight;
      if (!item.answer.correct && item.answer.confidence === 'sure') confidentWrong += 1;
    }
    const score = totalWeight ? Math.round(correctWeight / totalWeight * 100) : 0;
    return {
      objectiveId: page.objectiveId,
      title: page.title,
      domainId: page.domainId,
      domainTitle: domain?.title ?? page.domainId,
      blueprintWeight: (domain?.weight ?? 0) / Math.max(1, objectivesInDomain),
      score,
      evidence: evidence.length,
      confidentWrong,
      lastAnsweredAt: evidence[0]?.attempt.completedAt,
      status: masteryStatus(score, evidence.length)
    };
  });
}

export function selectStudyRecommendation(mastery: ObjectiveMastery[]): StudyRecommendation {
  if (!mastery.length) return { kind: 'mock', title: 'Choose a mock paper', description: 'Complete a mock exam to start building your study plan.' };
  const confidentGap = mastery
    .filter((objective) => objective.confidentWrong > 0)
    .sort((left, right) => right.confidentWrong - left.confidentWrong || left.score - right.score)[0];
  if (confidentGap) return revisionRecommendation(confidentGap, 'A confident wrong answer usually signals a misconception worth correcting first.');

  const measured = mastery.filter((objective) => objective.evidence > 0).sort((left, right) => left.score - right.score || right.blueprintWeight - left.blueprintWeight);
  const weakest = measured[0];
  if (weakest && weakest.score < 50) return revisionRecommendation(weakest, `Your weighted mastery is ${weakest.score}%. Review the concept before testing it again.`);
  if (weakest && (weakest.status === 'building' || weakest.score < 80)) {
    return { kind: 'drill', objectiveId: weakest.objectiveId, title: `Drill ${weakest.title}`, description: `A focused set will strengthen this ${weakest.score}% objective and add better evidence.` };
  }

  const unseen = mastery.filter((objective) => objective.status === 'unseen').sort((left, right) => right.blueprintWeight - left.blueprintWeight)[0];
  if (unseen) return { kind: 'drill', objectiveId: unseen.objectiveId, title: `Explore ${unseen.title}`, description: `You have no answer history here yet, and it represents an important part of the published blueprint.` };

  return { kind: 'mock', title: 'Validate with a timed mock', description: 'Every measured objective is ready. Use exam conditions to confirm that the knowledge holds together.' };
}

export function certificationReadiness(mastery: ObjectiveMastery[]): number {
  const totalBlueprintWeight = mastery.reduce((sum, item) => sum + item.blueprintWeight, 0);
  if (!totalBlueprintWeight) return 0;
  return Math.round(mastery.reduce((sum, item) => {
    const evidenceFactor = Math.min(1, item.evidence / 5);
    return sum + item.score * evidenceFactor * item.blueprintWeight;
  }, 0) / totalBlueprintWeight);
}

function confidenceEvidenceWeight(confidence: StudyConfidence | undefined, correct: boolean): number {
  if (confidence === 'sure') return correct ? 1.2 : 1.3;
  if (confidence === 'guess') return 0.75;
  return 1;
}

function masteryStatus(score: number, evidence: number): ObjectiveMastery['status'] {
  if (evidence === 0) return 'unseen';
  if (evidence < 5) return 'building';
  if (score < 60) return 'needs-work';
  if (score < 80) return 'developing';
  return 'ready';
}

function revisionRecommendation(objective: ObjectiveMastery, description: string): StudyRecommendation {
  return { kind: 'revision', objectiveId: objective.objectiveId, title: `Revise ${objective.title}`, description };
}
