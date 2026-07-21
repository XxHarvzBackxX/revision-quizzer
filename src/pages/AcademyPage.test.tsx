// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import { getRevisionCourse } from '../revision/registry';
import { getActiveStudyDrill } from '../study/storage';
import { AcademyPage } from './AcademyPage';

describe('AcademyPage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('shows the campaign and creates a playable domain boss', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const dataset = bossDataset();
    render(<AcademyPage
      examCode="AI-901"
      datasets={[dataset]}
      allDatasetSummaries={[dataset]}
      attempts={[]}
      isLoading={false}
      navigate={navigate}
      onToast={vi.fn()}
    />);

    expect(screen.getByRole('heading', { name: /Master the map/i })).toBeInTheDocument();
    expect(await screen.findByText('Warm-up run')).toBeInTheDocument();
    expect(screen.getByText('Responsible AI principles')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Start boss/i })[0]);

    expect(getActiveStudyDrill('AI-901')).toMatchObject({ mode: 'domain-boss', domainId: getRevisionCourse('AI-901')!.domains[0].id });
    expect(navigate).toHaveBeenCalledWith('/study/ai-901/drill/play');
  });
});

function bossDataset(): PublicDataset {
  const course = getRevisionCourse('AI-901')!;
  const domain = course.domains[0];
  const objectives = course.pages.filter((page) => page.domainId === domain.id).map((page) => page.objectiveId);
  const items = objectives.flatMap((objectiveId) => Array.from({ length: 12 }, (_, index) => ({
    id: `${objectiveId}-${index}`,
    type: 'multiple-choice' as const,
    prompt: `${objectiveId} question ${index}`,
    answer: 'A',
    options: ['A', 'B'],
    objectiveId,
    domainId: domain.id
  })));
  return {
    id: 'builtin-ai901-academy-test', slug: 'academy-test', title: 'Academy test', kind: 'exam', curated: true,
    examCode: 'AI-901', blueprintVersion: '2026', durationMinutes: 45, readinessTarget: 70,
    domains: [domain], items, itemCount: items.length, createdAt: '2026-01-01T00:00:00.000Z'
  };
}
