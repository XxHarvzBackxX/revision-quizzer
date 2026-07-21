// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatasetSummary } from '../../shared/quiz';
import { GalleryPage } from './GalleryPage';
import { HomePage } from './HomePage';

const curated: DatasetSummary = {
  id: 'curated-paper',
  slug: 'curated-paper',
  title: 'AI-901 Mock Exam 1: Curated paper',
  curated: true,
  examCode: 'AI-901',
  durationMinutes: 45,
  itemCount: 50,
  createdAt: '2026-07-15T00:00:00.000Z'
};

const official: DatasetSummary = {
  id: 'official-assessment',
  slug: 'official-assessment',
  title: 'AI-901: Official Microsoft Learn Practice Assessment Questions',
  curated: true,
  official: true,
  examCode: 'AI-901',
  durationMinutes: 45,
  itemCount: 50,
  createdAt: '2026-07-15T00:00:00.000Z'
};

describe('official dataset discovery', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('shows the official assessment first with its seal in the library', () => {
    const view = render(
      <GalleryPage
        datasets={[curated, official]}
        isLoading={false}
        attempts={[]}
        onRefresh={vi.fn()}
        navigate={vi.fn()}
        onToast={vi.fn()}
      />
    );

    const cards = view.container.querySelectorAll('.library-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[0] as HTMLElement).getByRole('heading', { name: official.title })).toBeInTheDocument();
    expect(within(cards[0] as HTMLElement).getByText('Official')).toHaveClass('official-pill');
    expect(within(cards[1] as HTMLElement).getByText('Curated')).toHaveClass('verified-pill');
  });

  it('shows the official assessment first with its seal on the home page', () => {
    const view = render(
      <HomePage
        datasets={[curated, official]}
        attempts={[]}
        activeSessions={[]}
        isLoading={false}
        navigate={vi.fn()}
      />
    );

    const cards = view.container.querySelectorAll('.featured-exam-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[0] as HTMLElement).getByRole('heading', { name: official.title })).toBeInTheDocument();
    expect(within(cards[0] as HTMLElement).getByText('Official')).toHaveClass('official-pill');
  });
});
