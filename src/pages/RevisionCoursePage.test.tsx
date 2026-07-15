// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevisionCoursePage } from './RevisionCoursePage';

describe('RevisionCoursePage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('shows every AI-901 objective and persists manual review status', async () => {
    const navigate = vi.fn();
    render(<RevisionCoursePage examCode="AI-901" navigate={navigate} />);
    expect(screen.getByText('Responsible AI principles')).toBeInTheDocument();
    expect(screen.getByText('Information extraction and Content Understanding')).toBeInTheDocument();
    const reviewButton = screen.getByLabelText('Mark Responsible AI principles reviewed');
    await userEvent.click(reviewButton);
    expect(screen.getByLabelText('Mark Responsible AI principles not reviewed')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('quiz-arcade:revision:v1') ?? '{}').reviewedPages['AI-901/responsible-ai']).toBeTruthy();
  });

  it('opens an objective with the canonical wiki route', async () => {
    const navigate = vi.fn();
    render(<RevisionCoursePage examCode="AZ-900" navigate={navigate} />);
    await userEvent.click(screen.getByText('Cloud computing'));
    expect(navigate).toHaveBeenCalledWith('/wiki/az-900/cloud-computing');
  });
});
