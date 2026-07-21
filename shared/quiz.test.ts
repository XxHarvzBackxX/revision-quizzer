import { describe, expect, it } from 'vitest';
import { answerSimilarity, isFreeWritePass, isResponseComplete, isResponseCorrect, officialDatasetsFirst, validateDataset } from './quiz';

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

  it('validates and scores an inline dropdown', () => {
    const item = {
      type: 'dropdown' as const,
      prompt: 'Azure {{blank}} provides private dedicated connectivity.',
      answer: 'ExpressRoute',
      options: ['ExpressRoute', 'DNS', 'Policy']
    };
    expect(validateDataset({ title: 'Dropdown', items: [item] }).ok).toBe(true);
    expect(isResponseCorrect(item, ['ExpressRoute'])).toBe(true);
    expect(validateDataset({ title: 'Bad dropdown', items: [{ ...item, prompt: 'No blank here.' }] }).ok).toBe(false);
  });

  it('requires all three ordered statement answers', () => {
    const item = {
      type: 'statement-group' as const,
      prompt: 'Evaluate each statement.',
      answerMode: 'yes-no' as const,
      statements: [
        { text: 'Azure supports availability zones.', answer: true },
        { text: 'Every region has three zones.', answer: false },
        { text: 'Zones are separate datacenter groups.', answer: true }
      ]
    };
    expect(validateDataset({ title: 'Statements', items: [item] }).ok).toBe(true);
    expect(isResponseComplete(item, ['Yes', '', 'Yes'])).toBe(false);
    expect(isResponseComplete(item, ['Yes', 'No', 'Yes'])).toBe(true);
    expect(isResponseCorrect(item, ['Yes', 'No', 'Yes'])).toBe(true);
    expect(isResponseCorrect(item, ['Yes', 'Yes', 'No'])).toBe(false);
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

  it('does not accept official provenance from dataset input', () => {
    const result = validateDataset({
      title: 'Claimed official set',
      official: true,
      items: [{ type: 'multiple-choice', prompt: 'Pick one', answer: 'A', options: ['A', 'B'] }]
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).not.toHaveProperty('official');
  });
});

describe('dataset discovery order', () => {
  it('puts official datasets first without changing order within either group', () => {
    const datasets = [
      { id: 'curated-1' },
      { id: 'official-1', official: true },
      { id: 'curated-2' },
      { id: 'official-2', official: true }
    ];

    expect(officialDatasetsFirst(datasets).map((dataset) => dataset.id)).toEqual([
      'official-1',
      'official-2',
      'curated-1',
      'curated-2'
    ]);
    expect(datasets.map((dataset) => dataset.id)).toEqual(['curated-1', 'official-1', 'curated-2', 'official-2']);
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
