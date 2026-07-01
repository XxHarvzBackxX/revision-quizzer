export type ScoreRecord = {
  datasetId: string;
  title: string;
  score: number;
  total: number;
  completedAt: string;
};

const SCORE_KEY = 'quiz-arcade:scores';

export function getScores(): ScoreRecord[] {
  try {
    const value = localStorage.getItem(SCORE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export function saveScore(record: ScoreRecord) {
  const scores = [record, ...getScores().filter((score) => score.datasetId !== record.datasetId)].slice(0, 12);
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}
