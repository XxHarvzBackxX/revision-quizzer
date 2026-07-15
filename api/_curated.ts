import paper1 from '../datasets/ai-901-mock-exam-1.json' with { type: 'json' };
import paper2 from '../datasets/ai-901-mock-exam-2.json' with { type: 'json' };
import paper3 from '../datasets/ai-901-mock-exam-3.json' with { type: 'json' };
import azurePaper1 from '../datasets/az-900-mock-exam-1.json' with { type: 'json' };
import azurePaper2 from '../datasets/az-900-mock-exam-2.json' with { type: 'json' };
import azurePaper3 from '../datasets/az-900-mock-exam-3.json' with { type: 'json' };
import { validateDataset, type DatasetInput, type DatasetSummary, type PublicDataset } from '../shared/quiz.js';

const CREATED_AT = '2026-07-15T00:00:00.000Z';
const inputs = [
  ...[paper1, paper2, paper3].map((input, index) => ({ input, examCode: 'AI-901', paper: index + 1 })),
  ...[azurePaper1, azurePaper2, azurePaper3].map((input, index) => ({ input, examCode: 'AZ-900', paper: index + 1 }))
].map(({ input, examCode, paper }) => ({
  dataset: validateCuratedInput(input as DatasetInput, `${examCode} paper ${paper}`),
  examCode,
  paper
}));

export const curatedDatasets: PublicDataset[] = inputs.map(({ dataset, examCode, paper }) => ({
  ...dataset,
  id: `builtin-${examCode.toLowerCase().replace('-', '')}-paper-${paper}`,
  slug: `${examCode.toLowerCase()}-mock-exam-${paper}`,
  itemCount: dataset.items.length,
  createdAt: CREATED_AT,
  status: 'approved'
}));

export function getCuratedSummaries(): DatasetSummary[] {
  return curatedDatasets.map(({ items: _items, ...summary }) => summary);
}

export function findCuratedDataset(value: string): PublicDataset | undefined {
  return curatedDatasets.find((dataset) => dataset.id === value || dataset.slug === value);
}

export function isSupersededCuratedDataset(dataset: DatasetSummary): boolean {
  return curatedDatasets.some((curated) => (
    dataset.examCode === curated.examCode || dataset.title.startsWith(`${curated.examCode} Mock Exam `)
  ));
}

function validateCuratedInput(input: DatasetInput, label: string): DatasetInput {
  const result = validateDataset(input);
  if (!result.ok) {
    throw new Error(`Built-in ${label} is invalid: ${result.errors.join(' ')}`);
  }
  return result.value;
}
