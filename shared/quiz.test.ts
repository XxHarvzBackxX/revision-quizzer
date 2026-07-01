import { describe, expect, it } from 'vitest';
import { answerSimilarity, isFreeWritePass, validateDataset } from './quiz';

describe('validateDataset', () => {
  it('accepts the three supported item types', () => {
    const result = validateDataset({
      title: 'Cells',
      description: 'Biology revision',
      tags: ['Biology', 'GCSE'],
      items: [
        { type: 'flashcard', prompt: 'Nucleus?', answer: 'Controls the cell' },
        { type: 'free-write', prompt: 'Plant food process?', answer: 'Photosynthesis' },
        {
          type: 'multiple-choice',
          prompt: 'Energy organelle?',
          answer: 'Mitochondria',
          options: ['Nucleus', 'Mitochondria', 'Cell wall']
        }
      ]
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(3);
      expect(result.value.tags).toEqual(['biology', 'gcse']);
    }
  });

  it('rejects invalid multiple-choice items', () => {
    const result = validateDataset({
      title: 'Bad set',
      items: [
        {
          type: 'multiple-choice',
          prompt: 'Pick one',
          answer: 'Correct',
          options: ['Wrong', 'Still wrong']
        }
      ]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('Item 1 options must include the answer.');
    }
  });
});

describe('free-write matching', () => {
  it('normalizes punctuation and case', () => {
    expect(isFreeWritePass('photo synthesis!', 'Photosynthesis')).toBe(true);
    expect(answerSimilarity('Photosynthesis!', 'photosynthesis')).toBe(1);
  });

  it('passes at 50 percent similarity and fails below it', () => {
    expect(isFreeWritePass('mitochondria', 'mitochondrion')).toBe(true);
    expect(isFreeWritePass('cell wall', 'photosynthesis')).toBe(false);
  });
});
