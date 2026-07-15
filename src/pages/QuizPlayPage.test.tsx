// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import { getStudyState } from '../study/storage';
import { QuizPlayPage } from './QuizPlayPage';

const dataset: PublicDataset = {
  id: 'builtin-ai901-paper-1', slug: 'ai-paper', title: 'AI paper', curated: true, kind: 'exam', examCode: 'AI-901', blueprintVersion: '2026',
  durationMinutes: 45, readinessTarget: 70, shuffleQuestions: false, domains: [{ id: 'domain', title: 'Domain', weight: 100 }], itemCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z', items: [{ id: 'q1', type: 'multiple-choice', prompt: 'Choose the correct service.', answer: 'Azure AI service', options: ['Azure AI service', 'Another service'], domainId: 'domain', objectiveId: 'responsible-ai', explanation: 'Because it matches the requirement.' }]
};

describe('QuizPlayPage study tools', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  afterEach(cleanup);

  it('records confidence and XP with the completed answer', async () => {
    const onAttempt = vi.fn();
    const navigate = vi.fn();
    render(<QuizPlayPage dataset={dataset} navigate={navigate} onAttempt={onAttempt} />);
    await userEvent.click(screen.getByRole('button', { name: /Sure/ }));
    await userEvent.click(screen.getByRole('button', { name: /Azure AI service/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    await userEvent.click(screen.getByRole('button', { name: /See results/ }));
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ answers: [expect.objectContaining({ confidence: 'sure', correct: true })] }));
    expect(getStudyState().activity[Object.keys(getStudyState().activity)[0]]).toMatchObject({ questionsAnswered: 1, correctAnswers: 1, xp: 10 });
  });

  it('saves a question note into the certification bookmark bank', async () => {
    render(<QuizPlayPage dataset={dataset} navigate={vi.fn()} onAttempt={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Add note/ }));
    await userEvent.type(screen.getByPlaceholderText(/Why was this tricky/), 'Remember the product boundary.');
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }));
    expect(getStudyState().bookmarks['builtin-ai901-paper-1/q1'].note).toBe('Remember the product boundary.');
  });
});
