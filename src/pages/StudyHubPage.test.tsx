// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatasetSummary } from '../../shared/quiz';
import { getStudyState } from '../study/storage';
import { StudyHubPage } from './StudyHubPage';

vi.mock('../account/AccountContext', () => ({
  useOptionalAccount: () => ({
    uid: 'study-user-123', email: 'player@example.com', handle: 'cloud_player', avatar: 'cloud-fox',
    attributionEnabled: true, admin: false, createdAt: '2026-07-22T00:00:00.000Z'
  })
}));

const summary = { id: 'builtin-ai901-paper-1', slug: 'ai-901-mock-exam-1', title: 'AI-901 Mock Exam 1', curated: true, examCode: 'AI-901', itemCount: 50 } as DatasetSummary;

describe('StudyHubPage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('shows a personalised starting action and persists study settings', async () => {
    const navigate = vi.fn();
    render(<StudyHubPage examCode="AI-901" datasets={[summary]} attempts={[]} navigate={navigate} />);
    expect(screen.getByText('@cloud_player')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open @cloud_player player profile' }));
    expect(navigate).toHaveBeenCalledWith('/study/profile');
    expect(screen.getByRole('heading', { name: /Know what to do next/ })).toBeInTheDocument();
    expect(screen.getAllByText('Explore Responsible AI principles')).toHaveLength(2);
    expect(screen.getByText(/campaign stars/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /View on map/ }));
    expect(navigate).toHaveBeenCalledWith('/study/ai-901/academy?objective=responsible-ai');
    await userEvent.selectOptions(screen.getByLabelText(/Daily question target/), '20');
    await userEvent.click(screen.getByText('Confidence controls in timed exams'));
    expect(getStudyState().settings).toEqual({ dailyQuestionGoal: 20, showExamConfidence: true });
  });
});
