// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import { getReviewState, recordReviewResponse } from '../review/storage';
import { MistakeReviewPage } from './MistakeReviewPage';

const dataset: PublicDataset = {
  id: 'community-review', slug: 'community-review', title: 'Community Review', kind: 'quiz', curated: false,
  shuffleQuestions: false, itemCount: 1, createdAt: '2026-07-01T00:00:00.000Z',
  items: [{ id: 'q1', type: 'multiple-choice', prompt: 'Which option is right?', options: ['Right', 'Wrong'], answer: 'Right', explanation: 'Right is correct.' }]
};

describe('MistakeReviewPage', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/study/mistakes');
  });

  it('shows due mistakes and launches a review session', () => {
    recordReviewResponse({ dataset, item: dataset.items[0], questionIndex: 0, correct: false, confidence: 'sure', answeredAt: new Date(2026, 0, 1) });
    const navigate = vi.fn();
    render(<MistakeReviewPage datasets={[dataset]} isLoading={false} navigate={navigate} />);

    expect(screen.getByText('Which option is right?')).toBeInTheDocument();
    expect(screen.getByText('Confident mistake')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Review 1/i }));
    expect(getReviewState().activeSession?.questionKeys).toEqual(['community-review/q1']);
    expect(navigate).toHaveBeenCalledWith('/study/mistakes/play');
  });

  it('shows a clean empty state before the first mistake', () => {
    render(<MistakeReviewPage datasets={[]} isLoading={false} navigate={vi.fn()} />);
    expect(screen.getByText('No mistakes recorded yet.')).toBeInTheDocument();
  });
});
