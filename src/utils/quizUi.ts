import type { DatasetInput } from '../../shared/quiz';
import { validateDataset } from '../../shared/quiz';
import type { ToastKind } from '../types';

export const sampleDataset = JSON.stringify(
  {
    title: 'Biology Basics',
    description: 'A tiny starter set for testing Quiz Arcade.',
    tags: ['biology', 'starter'],
    items: [
      { type: 'flashcard', prompt: 'What does the nucleus do?', answer: "Controls the cell's activities" },
      { type: 'free-write', prompt: 'What process do plants use to make glucose?', answer: 'Photosynthesis' },
      {
        type: 'multiple-choice',
        prompt: 'Which organelle releases energy?',
        answer: 'Mitochondria',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cell wall']
      }
    ]
  },
  null,
  2
);

export function parseDataset(raw: string): { dataset: DatasetInput | null; errors: string[] } {
  try {
    const parsed = JSON.parse(raw);
    const result = validateDataset(parsed);
    return result.ok ? { dataset: result.value, errors: [] } : { dataset: null, errors: result.errors };
  } catch {
    return { dataset: null, errors: ['JSON could not be parsed.'] };
  }
}

export async function copyShareLink(slug: string, onToast: (kind: ToastKind, message: string) => void) {
  const url = `${window.location.origin}/quiz/${slug}`;
  try {
    await navigator.clipboard?.writeText(url);
    onToast('success', 'Share link copied.');
  } catch {
    onToast('error', 'Could not copy the share link.');
  }
}
