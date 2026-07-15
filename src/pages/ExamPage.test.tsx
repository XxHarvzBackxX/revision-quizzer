// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import { updateStudySettings } from '../study/storage';
import { ExamPage } from './ExamPage';

const dataset: PublicDataset = {
  id: 'builtin-ai901-paper-1', slug: 'paper', title: 'Paper', curated: true, kind: 'exam', examCode: 'AI-901', blueprintVersion: '2026',
  durationMinutes: 45, readinessTarget: 70, shuffleQuestions: false, domains: [{ id: 'domain', title: 'Domain', weight: 100 }], itemCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z', items: [{ id: 'q1', type: 'multiple-choice', prompt: 'Question', answer: 'A', options: ['A', 'B'], domainId: 'domain', objectiveId: 'responsible-ai' }]
};

describe('ExamPage confidence setting', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('keeps confidence hidden by default and shows it when enabled', () => {
    const view = render(<ExamPage dataset={dataset} navigate={vi.fn()} onAttempt={vi.fn()} />);
    expect(screen.queryByText('How confident are you?')).not.toBeInTheDocument();
    view.unmount();
    updateStudySettings({ showExamConfidence: true });
    render(<ExamPage dataset={dataset} navigate={vi.fn()} onAttempt={vi.fn()} />);
    expect(screen.getByText('How confident are you?')).toBeInTheDocument();
  });
});
