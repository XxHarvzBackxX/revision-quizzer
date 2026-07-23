// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicDataset } from '../../shared/quiz';
import { getStudyState } from '../study/storage';
import { getReviewState } from '../review/storage';
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

  it('adds an incorrect answer to the global mistake notebook', async () => {
    render(<QuizPlayPage dataset={dataset} navigate={vi.fn()} onAttempt={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Sure/ }));
    await userEvent.click(screen.getByRole('button', { name: /Another service/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(getReviewState().records['builtin-ai901-paper-1/q1']).toMatchObject({ examCode: 'AI-901', wrongCount: 1, lastConfidence: 'sure', correctStreak: 0 });
  });

  it('renders and scores an inline dropdown', async () => {
    const dropdownDataset: PublicDataset = {
      ...dataset,
      id: 'dropdown-paper',
      items: [{ id: 'drop-1', type: 'dropdown', prompt: 'Use {{blank}} for a private dedicated Azure connection.', answer: 'ExpressRoute', options: ['VPN Gateway', 'ExpressRoute'], domainId: 'domain', objectiveId: 'networking', explanation: 'ExpressRoute provides private dedicated connectivity.' }]
    };
    render(<QuizPlayPage dataset={dropdownDataset} navigate={vi.fn()} onAttempt={vi.fn()} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Select the missing text' }), 'ExpressRoute');
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
  });

  it('requires and scores every row in a statement group', async () => {
    const statementDataset: PublicDataset = {
      ...dataset,
      id: 'statement-paper',
      items: [{
        id: 'statements-1', type: 'statement-group', prompt: 'Evaluate the statements.', answerMode: 'yes-no', domainId: 'domain', objectiveId: 'architecture', explanation: 'Zones are separate datacenter groups, but availability varies by region.',
        statements: [
          { text: 'Availability zones are physically separate.', answer: true },
          { text: 'Every Azure region has availability zones.', answer: false },
          { text: 'Zones can improve resiliency.', answer: true }
        ]
      }]
    };
    render(<QuizPlayPage dataset={statementDataset} navigate={vi.fn()} onAttempt={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    const yes = screen.getAllByRole('radio', { name: 'Yes' });
    const no = screen.getAllByRole('radio', { name: 'No' });
    await userEvent.click(yes[0]);
    await userEvent.click(no[1]);
    await userEvent.click(yes[2]);
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
  });
});
