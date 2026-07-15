import { describe, expect, it } from 'vitest';
import { answerSimilarity, isFreeWritePass, isResponseCorrect, validateDataset } from './quiz';

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

  it('accepts multi-select questions and requires every answer', () => {
    const item = {
      type: 'multi-select' as const,
      prompt: 'Choose two',
      answers: ['One', 'Two'],
      options: ['One', 'Two', 'Three']
    };
    const result = validateDataset({ title: 'Selections', items: [item] });
    expect(result.ok).toBe(true);
    expect(isResponseCorrect(item, ['Two', 'One'])).toBe(true);
    expect(isResponseCorrect(item, ['One'])).toBe(false);
    expect(isResponseCorrect(item, ['One', 'Three'])).toBe(false);
  });

  it('requires complete metadata for curated exams', () => {
    const result = validateDataset({
      title: 'Incomplete exam',
      kind: 'exam',
      curated: true,
      items: [{ type: 'multiple-choice', prompt: 'Question', answer: 'A', options: ['A', 'B'] }]
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('Curated exams must include an exam code.');
      expect(result.errors).toContain('Item 1 must include an explanation.');
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
