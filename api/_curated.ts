import paper1 from '../datasets/ai-901-mock-exam-1.json' with { type: 'json' };
import paper2 from '../datasets/ai-901-mock-exam-2.json' with { type: 'json' };
import paper3 from '../datasets/ai-901-mock-exam-3.json' with { type: 'json' };
import officialPractice from '../datasets/ai-901-official-microsoft-learn-practice-assessment.json' with { type: 'json' };
import azurePaper1 from '../datasets/az-900-mock-exam-1.json' with { type: 'json' };
import azurePaper2 from '../datasets/az-900-mock-exam-2.json' with { type: 'json' };
import azurePaper3 from '../datasets/az-900-mock-exam-3.json' with { type: 'json' };
import { validateDataset, type DatasetInput, type DatasetSummary, type PublicDataset } from '../shared/quiz.js';

const CREATED_AT = '2026-07-15T00:00:00.000Z';
const inputs = [
  ...[paper1, paper2, paper3].map((input, index) => ({ input, label: `AI-901 paper ${index + 1}`, id: `builtin-ai901-paper-${index + 1}`, slug: `ai-901-mock-exam-${index + 1}` })),
  { input: officialPractice, label: 'AI-901 official practice assessment', id: 'builtin-ai901-official-practice-assessment', slug: 'ai-901-official-microsoft-learn-practice-assessment' },
  ...[azurePaper1, azurePaper2, azurePaper3].map((input, index) => ({ input, label: `AZ-900 paper ${index + 1}`, id: `builtin-az900-paper-${index + 1}`, slug: `az-900-mock-exam-${index + 1}` }))
].map(({ input, label, id, slug }) => ({
  dataset: validateCuratedInput(input as DatasetInput, label),
  id,
  slug
}));

export const curatedDatasets: PublicDataset[] = inputs.map(({ dataset, id, slug }) => ({
  ...dataset,
  id,
  slug,
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
