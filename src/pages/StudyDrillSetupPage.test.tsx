// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatasetSummary, PublicDataset } from '../../shared/quiz';
import { getActiveStudyDrill } from '../study/storage';
import { StudyDrillSetupPage } from './StudyDrillSetupPage';

const dataset: PublicDataset = {
  id: 'builtin-ai901-paper-1', slug: 'paper', title: 'Paper', curated: true, kind: 'exam', examCode: 'AI-901', blueprintVersion: '2026', durationMinutes: 45,
  readinessTarget: 70, shuffleQuestions: false, domains: [{ id: 'ai-workloads-fundamentals', title: 'AI workloads', weight: 100 }], itemCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z', items: [{ id: 'q1', type: 'multiple-choice', prompt: 'Responsible AI question', answer: 'A', options: ['A', 'B'], domainId: 'ai-workloads-fundamentals', objectiveId: 'responsible-ai', difficulty: 'medium' }]
};

describe('StudyDrillSetupPage', () => {
  beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/study/ai-901/drill'); });
  afterEach(cleanup);

  it('creates a certification-wide drill configuration', async () => {
    const navigate = vi.fn();
    render(<StudyDrillSetupPage examCode="AI-901" datasets={[dataset]} allDatasetSummaries={[dataset as DatasetSummary]} attempts={[]} isLoading={false} navigate={navigate} onToast={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /All questions/ }));
    expect(screen.getByRole('heading', { name: 'question ready' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Start drill/ }));
    expect(getActiveStudyDrill('AI-901')?.questionKeys).toEqual(['builtin-ai901-paper-1/q1']);
    expect(navigate).toHaveBeenCalledWith('/study/ai-901/drill/play');
  });
});
