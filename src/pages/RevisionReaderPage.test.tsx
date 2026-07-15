// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevisionReaderPage } from './RevisionReaderPage';

describe('RevisionReaderPage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('creates a coloured section note and persists it beside the page', async () => {
    render(<RevisionReaderPage examCode="AI-901" pageSlug="responsible-ai" navigate={vi.fn()} onToast={vi.fn()} />);
    await userEvent.click(screen.getAllByTitle('Add a note to this section')[0]);
    const note = screen.getByPlaceholderText('Add your own reminder, mnemonic, or question…');
    await userEvent.type(note, 'Remember: accountability needs a named owner.');
    await userEvent.click(screen.getByLabelText('Save yellow section note'));

    const state = JSON.parse(localStorage.getItem('quiz-arcade:revision:v1') ?? '{}');
    expect(state.highlights[0]).toMatchObject({
      courseCode: 'AI-901', pageId: 'responsible-ai', blockId: 'responsible-ai-overview', kind: 'block', color: 'yellow',
      note: 'Remember: accountability needs a named owner.'
    });
    expect(screen.getByText('Remember: accountability needs a named owner.')).toBeInTheDocument();
  });

  it('marks a page reviewed from the article header', async () => {
    render(<RevisionReaderPage examCode="AZ-900" pageSlug="cloud-computing" navigate={vi.fn()} onToast={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mark reviewed' }));
    expect(screen.getByRole('button', { name: 'Reviewed' })).toBeInTheDocument();
  });

  it('makes revision checklist items clickable and persistent', async () => {
    render(<RevisionReaderPage examCode="AI-901" pageSlug="responsible-ai" navigate={vi.fn()} onToast={vi.fn()} />);
    const item = screen.getByRole('checkbox', { name: 'Recall all six principles without prompts' });
    expect(item).not.toBeChecked();
    await userEvent.click(item);
    expect(item).toBeChecked();
    const state = JSON.parse(localStorage.getItem('quiz-arcade:revision:v1') ?? '{}');
    expect(state.checkedItems['AI-901/responsible-ai/responsible-ai-checklist/i0']).toBeTruthy();
  });
});
