// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudyIndexPage } from './StudyIndexPage';

describe('StudyIndexPage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('lists every certification hub and opens the selected study plan', async () => {
    const navigate = vi.fn();
    render(<StudyIndexPage datasets={[]} attempts={[]} navigate={navigate} />);
    expect(screen.getByRole('heading', { name: /Pick a certification/ })).toBeInTheDocument();
    expect(screen.getByText('AI in Azure')).toBeInTheDocument();
    expect(screen.getByText('Azure Fundamentals')).toBeInTheDocument();
    const openButtons = screen.getAllByRole('button', { name: /Open study plan/ });
    expect(openButtons).toHaveLength(2);
    await userEvent.click(openButtons[0]);
    expect(navigate).toHaveBeenCalledWith('/study/ai-901');
  });
});
