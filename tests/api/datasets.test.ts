import { describe, expect, it } from 'vitest';
import { isPublicDataset, toDatasetSummary, toPublicDataset } from '../../api/_datasets';

const createdAt = new Date('2026-07-20T12:34:56.000Z');
const storedDataset = {
  slug: 'cloud-basics',
  title: 'Cloud basics',
  description: 'A short quiz',
  tags: ['cloud'],
  shuffleQuestions: true,
  itemCount: 1,
  createdAt: { toDate: () => createdAt },
  status: 'approved',
  items: [{ type: 'flashcard', prompt: 'What is IaaS?', answer: 'Infrastructure as a service' }]
};

describe('dataset persistence mapping', () => {
  it('maps shared summary fields without exposing items', () => {
    const summary = toDatasetSummary('dataset-1', storedDataset);

    expect(summary).toMatchObject({
      id: 'dataset-1',
      slug: 'cloud-basics',
      title: 'Cloud basics',
      itemCount: 1,
      createdAt: createdAt.toISOString(),
      status: 'approved'
    });
    expect(summary).not.toHaveProperty('items');
  });

  it('adds items when mapping a full public dataset', () => {
    const dataset = toPublicDataset('dataset-1', storedDataset);

    expect(dataset.items).toEqual(storedDataset.items);
  });

  it('only treats approved or legacy status-less datasets as public', () => {
    expect(isPublicDataset({ status: 'approved' })).toBe(true);
    expect(isPublicDataset({})).toBe(true);
    expect(isPublicDataset({ status: 'pending' })).toBe(false);
  });
});
