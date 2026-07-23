// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalPage } from './LegalPage';

describe('account transparency pages', () => {
  afterEach(cleanup);

  it('identifies the controller and explains guest and account storage', () => {
    render(<LegalPage kind="privacy" navigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getAllByText(/Harvey Wells/)).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'harvey.wells.07@gmail.com' })).toHaveAttribute('href', 'mailto:harvey.wells.07@gmail.com');
    expect(screen.getByText(/Guests can browse and practise/)).toBeInTheDocument();
    expect(screen.getByText(/23 months of inactivity/)).toBeInTheDocument();
    expect(screen.getByText(/Automatic deletion pauses if warning delivery is unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Each change requires a reason and is recorded in a private audit log/)).toBeInTheDocument();
  });

  it('publishes account terms and separate contribution guidelines', () => {
    const { rerender } = render(<LegalPage kind="terms" navigate={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Your submissions' })).toBeInTheDocument();

    rerender(<LegalPage kind="community-guidelines" navigate={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Community Guidelines' })).toBeInTheDocument();
    expect(screen.getByText(/Do not upload real exam dumps/)).toBeInTheDocument();
    expect(screen.getByText(/Offensive, harassing, impersonating, or misleading handles may be corrected/)).toBeInTheDocument();
  });
});
