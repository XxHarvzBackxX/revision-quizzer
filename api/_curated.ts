import paper1 from '../datasets/ai-901-mock-exam-1.json' with { type: 'json' };
import paper2 from '../datasets/ai-901-mock-exam-2.json' with { type: 'json' };
import paper3 from '../datasets/ai-901-mock-exam-3.json' with { type: 'json' };
import { validateDataset, type DatasetInput, type DatasetSummary, type PublicDataset } from '../shared/quiz.js';

const CREATED_AT = '2026-07-15T00:00:00.000Z';
const inputs = [paper1, paper2, paper3].map((input, index) => validateCuratedInput(input as DatasetInput, index));

export const curatedDatasets: PublicDataset[] = inputs.map((dataset, index) => ({
  ...dataset,
  id: `builtin-ai901-paper-${index + 1}`,
  slug: `ai-901-mock-exam-${index + 1}`,
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
  return dataset.examCode === 'AI-901' || /^AI-901 Mock Exam [123](?::|\b)/i.test(dataset.title);
}

function validateCuratedInput(input: DatasetInput, index: number): DatasetInput {
  const result = validateDataset(input);
  if (!result.ok) {
    throw new Error(`Built-in AI-901 paper ${index + 1} is invalid: ${result.errors.join(' ')}`);
  }
  return result.value;
}
