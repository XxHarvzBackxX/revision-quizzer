export function mc(objectiveId, difficulty, prompt, answer, distractors, explanation, reference) {
  return { type: 'multiple-choice', objectiveId, difficulty, prompt, answer, options: [answer, ...distractors], explanation, reference };
}

export function multi(objectiveId, difficulty, prompt, answers, distractors, explanation, reference) {
  return { type: 'multi-select', objectiveId, difficulty, prompt, answers, options: [...answers, ...distractors], explanation, reference };
}

export function dropdown(objectiveId, difficulty, prompt, answer, distractors, explanation, reference) {
  return { type: 'dropdown', objectiveId, difficulty, prompt, answer, options: [answer, ...distractors], explanation, reference };
}

export function statements(objectiveId, difficulty, prompt, answerMode, rows, explanation, reference) {
  return {
    type: 'statement-group', objectiveId, difficulty, prompt, answerMode,
    statements: rows.map(([text, answer]) => ({ text, answer })), explanation, reference
  };
}

export function calibrateDifficulties(items, easyTarget = 10, hardTarget = 10) {
  const calibrated = items.map((item) => ({ ...item }));
  for (const [difficulty, target] of [['easy', easyTarget], ['hard', hardTarget]]) {
    const matching = calibrated.flatMap((item, index) => item.difficulty === difficulty ? [index] : []);
    if (matching.length < target) throw new Error(`Not enough ${difficulty} questions to calibrate paper`);
    matching.slice(target).forEach((index) => { calibrated[index].difficulty = 'medium'; });
  }
  return calibrated;
}
