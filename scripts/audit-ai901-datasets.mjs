import { readFileSync } from 'node:fs';

const files = [1, 2, 3].map((number) => `datasets/ai-901-mock-exam-${number}.json`);
const allPrompts = [];
let failed = false;

for (const file of files) {
  const dataset = JSON.parse(readFileSync(file, 'utf8'));
  const errors = [];
  if (dataset.items.length !== 50) errors.push(`expected 50 questions, found ${dataset.items.length}`);
  if (dataset.kind !== 'exam' || !dataset.curated) errors.push('dataset is not marked as a curated exam');
  if (dataset.blueprintVersion !== '2026-04-15') errors.push('blueprint version is not current');

  const domains = count(dataset.items, 'domainId');
  if (domains.concepts !== 22 || domains.foundry !== 28) errors.push(`domain split is ${domains.concepts || 0}/${domains.foundry || 0}, expected 22/28`);
  const difficulties = count(dataset.items, 'difficulty');
  if (difficulties.easy !== 10 || difficulties.medium !== 30 || difficulties.hard !== 10) errors.push('difficulty split must be 10/30/10');
  const types = count(dataset.items, 'type');
  if (types['multi-select'] !== 4 || types['multiple-choice'] !== 46) errors.push('question types must be 46 single-select and 4 multi-select');

  const ids = new Set();
  dataset.items.forEach((item, index) => {
    const label = `question ${index + 1}`;
    if (!item.id || ids.has(item.id)) errors.push(`${label} has a missing or duplicate ID`);
    ids.add(item.id);
    if (!item.explanation || item.explanation.length < 80) errors.push(`${label} needs a substantive explanation`);
    if (!item.objectiveId || !item.domainId || !item.difficulty) errors.push(`${label} has incomplete blueprint metadata`);
    if (!item.references?.length || item.references.some((reference) => !reference.url.startsWith('https://learn.microsoft.com/'))) errors.push(`${label} must reference Microsoft Learn`);
    if (new Set(item.options.map(normalize)).size !== item.options.length) errors.push(`${label} contains duplicate options`);
    const correct = item.type === 'multi-select' ? item.answers : [item.answer];
    if (correct.some((answer) => !item.options.some((option) => normalize(option) === normalize(answer)))) errors.push(`${label} has an answer outside its options`);
    allPrompts.push({ file, index, prompt: item.prompt, tokens: tokenSet(item.prompt) });
  });

  if (errors.length) {
    failed = true;
    console.error(`\n${file}`);
    errors.forEach((error) => console.error(`  - ${error}`));
  } else {
    console.log(`✓ ${file}: 50 questions, 22/28 domains, 10/30/10 difficulty, 46/4 formats`);
  }
}

for (let left = 0; left < allPrompts.length; left += 1) {
  for (let right = left + 1; right < allPrompts.length; right += 1) {
    const similarity = jaccard(allPrompts[left].tokens, allPrompts[right].tokens);
    if (similarity >= 0.82) {
      failed = true;
      console.error(`Near-duplicate prompts: ${allPrompts[left].file} #${allPrompts[left].index + 1} and ${allPrompts[right].file} #${allPrompts[right].index + 1} (${Math.round(similarity * 100)}%)`);
    }
  }
}

if (failed) process.exitCode = 1;
else console.log('✓ Cross-paper duplicate audit passed');

function count(items, property) {
  return items.reduce((result, item) => ({ ...result, [item[property]]: (result[item[property]] || 0) + 1 }), {});
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
