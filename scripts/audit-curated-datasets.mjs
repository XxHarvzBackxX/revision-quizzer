import { readFileSync } from 'node:fs';

const formats = [
  { 'multiple-choice': 28, 'multi-select': 7, dropdown: 8, 'statement-group': 7 },
  { 'multiple-choice': 28, 'multi-select': 7, dropdown: 7, 'statement-group': 8 },
  { 'multiple-choice': 28, 'multi-select': 7, dropdown: 8, 'statement-group': 7 }
];

const definitions = [
  {
    examCode: 'AI-901', filePrefix: 'ai-901', blueprintVersion: '2026-04-15',
    domains: { concepts: 22, foundry: 28 },
    objectives: { 'responsible-ai': 6, 'model-components': 6, 'ai-workloads': 10, 'foundry-generative': 10, 'foundry-text-speech': 6, 'foundry-vision': 5, 'foundry-extraction': 7 }
  },
  {
    examCode: 'AZ-900', filePrefix: 'az-900', blueprintVersion: '2026-07-20',
    domains: { 'cloud-concepts': 14, 'architecture-services': 19, 'management-governance': 17 },
    objectives: { 'cloud-computing': 5, 'cloud-benefits': 4, 'service-types': 5, 'azure-architecture': 4, 'compute-networking': 5, 'azure-storage': 5, 'identity-security': 5, 'cost-management': 4, 'governance-compliance': 4, 'management-deployment': 5, monitoring: 4 }
  }
];

const allPrompts = [];
const allIds = new Set();
const allExplanations = new Set();
let failed = false;

for (const definition of definitions) {
  const examItems = [];
  const blankPositions = { start: 0, middle: 0, end: 0 };
  let trueStatements = 0;
  let falseStatements = 0;

  for (let paperIndex = 0; paperIndex < 3; paperIndex += 1) {
    const file = `datasets/${definition.filePrefix}-mock-exam-${paperIndex + 1}.json`;
    const dataset = JSON.parse(readFileSync(file, 'utf8'));
    const errors = [];
    const expectedFormats = formats[paperIndex];

    if (dataset.items.length !== 50) errors.push(`expected 50 questions, found ${dataset.items.length}`);
    if (dataset.kind !== 'exam' || !dataset.curated) errors.push('dataset is not marked as a curated exam');
    if (dataset.examCode !== definition.examCode) errors.push(`exam code must be ${definition.examCode}`);
    if (dataset.blueprintVersion !== definition.blueprintVersion) errors.push(`blueprint version must be ${definition.blueprintVersion}`);
    if (dataset.contentRevision !== '2026-realistic-v1') errors.push('content revision must be 2026-realistic-v1');

    checkCounts(errors, 'domain', count(dataset.items, 'domainId'), definition.domains);
    checkCounts(errors, 'objective', count(dataset.items, 'objectiveId'), definition.objectives);
    checkCounts(errors, 'format', count(dataset.items, 'type'), expectedFormats);
    checkCounts(errors, 'difficulty', count(dataset.items, 'difficulty'), { easy: 10, medium: 30, hard: 10 });

    const paperIds = new Set();
    const optionSets = new Set();
    dataset.items.forEach((item, index) => {
      const label = `question ${index + 1}`;
      if (!item.id || paperIds.has(item.id) || allIds.has(item.id)) errors.push(`${label} has a missing or duplicate ID`);
      paperIds.add(item.id);
      allIds.add(item.id);
      if (!item.explanation || item.explanation.length < 110) errors.push(`${label} needs an explanation of at least 110 characters`);
      const explanationKey = normalize(item.explanation);
      if (allExplanations.has(explanationKey)) errors.push(`${label} repeats another explanation`);
      allExplanations.add(explanationKey);
      if (/is the best answer because it directly matches|are the required choices because/i.test(item.explanation)) errors.push(`${label} uses a generic answer explanation`);
      if (!item.objectiveId || !item.domainId || !item.difficulty) errors.push(`${label} has incomplete blueprint metadata`);
      if (!item.references?.length || item.references.some((reference) => !reference.url.startsWith('https://learn.microsoft.com/'))) errors.push(`${label} must reference Microsoft Learn`);

      if (item.type === 'statement-group') {
        if (item.statements?.length !== 3) errors.push(`${label} must contain exactly three statements`);
        if (new Set(item.statements?.map((statement) => normalize(statement.text))).size !== 3) errors.push(`${label} repeats a statement row`);
        for (const statement of item.statements ?? []) statement.answer ? trueStatements += 1 : falseStatements += 1;
      } else {
        if (!Array.isArray(item.options) || new Set(item.options.map(normalize)).size !== item.options.length) errors.push(`${label} contains missing or duplicate options`);
        const correct = item.type === 'multi-select' ? item.answers : [item.answer];
        if (correct.some((answer) => !item.options.some((option) => normalize(option) === normalize(answer)))) errors.push(`${label} has an answer outside its options`);
        if (item.type === 'multi-select' && (correct.length !== 2 || !/\bTWO\b/.test(item.prompt))) errors.push(`${label} must ask for exactly TWO answers`);
        const optionSet = item.options.map(normalize).sort().join('|');
        if (optionSets.has(optionSet)) errors.push(`${label} repeats an option set within the paper`);
        optionSets.add(optionSet);
      }

      if (item.type === 'dropdown') {
        const markerCount = item.prompt.split('{{blank}}').length - 1;
        if (markerCount !== 1) errors.push(`${label} must contain exactly one dropdown blank`);
        else blankPositions[classifyBlank(item.prompt)] += 1;
      }

      const promptKey = normalize(item.prompt);
      allPrompts.push({ file, index, prompt: item.prompt, key: promptKey, tokens: tokenSet(item.prompt) });
      examItems.push(item);
    });

    report(file, errors, definition.domains, expectedFormats);
  }

  const examErrors = [];
  checkCounts(examErrors, 'dropdown position', blankPositions, { start: 7, middle: 8, end: 8 });
  if (trueStatements !== 33 || falseStatements !== 33) examErrors.push(`statement answers must balance 33 true and 33 false; found ${trueStatements}/${falseStatements}`);
  checkRepeatLimit(examErrors, examItems, definition.examCode);
  report(`${definition.examCode} full-bank quality`, examErrors);
}

for (let left = 0; left < allPrompts.length; left += 1) {
  for (let right = left + 1; right < allPrompts.length; right += 1) {
    if (allPrompts[left].key === allPrompts[right].key) {
      fail(`Duplicate prompts: ${location(allPrompts[left])} and ${location(allPrompts[right])}`);
      continue;
    }
    const similarity = jaccard(allPrompts[left].tokens, allPrompts[right].tokens);
    if (similarity >= 0.84) fail(`Near-duplicate prompts: ${location(allPrompts[left])} and ${location(allPrompts[right])} (${Math.round(similarity * 100)}%)`);
  }
}

if (failed) process.exitCode = 1;
else console.log('✓ Cross-paper uniqueness audit passed for all six curated exams');

function report(label, errors, domains, expectedFormats) {
  if (errors.length) {
    failed = true;
    console.error(`\n${label}`);
    errors.forEach((error) => console.error(`  - ${error}`));
    return;
  }
  if (domains && expectedFormats) {
    const domainSummary = Object.entries(domains).map(([id, value]) => `${id}=${value}`).join(', ');
    const formatSummary = Object.entries(expectedFormats).map(([id, value]) => `${id}=${value}`).join(', ');
    console.log(`✓ ${label}: ${domainSummary}; ${formatSummary}; difficulty=10/30/10`);
  } else console.log(`✓ ${label}`);
}

function checkCounts(errors, label, actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) errors.push(`${label} ${key} has ${actual[key] ?? 0}; expected ${value}`);
  }
  const unexpected = Object.keys(actual).filter((key) => !(key in expected));
  if (unexpected.length) errors.push(`unexpected ${label} values: ${unexpected.join(', ')}`);
}

function checkRepeatLimit(errors, items, examCode) {
  const correct = new Map();
  const distractors = new Map();
  for (const item of items) {
    if (item.type === 'statement-group') continue;
    const answers = (item.type === 'multi-select' ? item.answers : [item.answer]).map(normalize);
    for (const answer of answers) increment(correct, answer);
    for (const option of item.options) if (!answers.includes(normalize(option))) increment(distractors, normalize(option));
  }
  const repeatedCorrect = [...correct].filter(([, value]) => value > 4);
  const repeatedDistractors = [...distractors].filter(([, value]) => value > 10);
  if (repeatedCorrect.length) errors.push(`${examCode} repeats correct answers more than four times: ${formatRepeats(repeatedCorrect)}`);
  if (repeatedDistractors.length) errors.push(`${examCode} repeats distractors more than ten times: ${formatRepeats(repeatedDistractors)}`);
}

function count(items, property) {
  return items.reduce((result, item) => ({ ...result, [item[property]]: (result[item[property]] || 0) + 1 }), {});
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function formatRepeats(entries) {
  return entries.map(([value, total]) => `“${value}” (${total})`).join(', ');
}

function classifyBlank(prompt) {
  const [before, after] = prompt.split('{{blank}}');
  if (!before.trim()) return 'start';
  if (!after.replace(/[.?!,:;\s]/g, '').trim()) return 'end';
  return 'middle';
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenSet(value) {
  return new Set(normalize(value).split(' ').filter((token) => token.length > 3));
}

function jaccard(left, right) {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function location(item) {
  return `${item.file} #${item.index + 1}`;
}

function fail(message) {
  failed = true;
  console.error(message);
}
