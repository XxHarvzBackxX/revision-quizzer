// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_VERSION, CHANGELOG_STORAGE_KEY } from '../changelog';
import { ChangelogExperience } from './ChangelogExperience';

describe('changelog experience', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('automatically shows the current release and does not show it after dismissal', async () => {
    const user = userEvent.setup();
    const firstVisit = render(<ChangelogExperience />);

    expect(screen.getByRole('dialog', { name: 'What’s new in Quiz Arcade' })).toBeInTheDocument();
    expect(screen.getAllByText(`v${APP_VERSION}`)).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(CHANGELOG_STORAGE_KEY)).toContain(APP_VERSION);

    firstVisit.unmount();
    render(<ChangelogExperience />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(`Quiz Arcade version ${APP_VERSION}`)).toBeInTheDocument();
  });

  it('opens every prior release from Changelog History in the footer', async () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, JSON.stringify({ version: 1, readVersions: [APP_VERSION] }));
    render(<ChangelogExperience />);

    await userEvent.click(screen.getByRole('button', { name: 'Changelog History' }));

    expect(screen.getByRole('dialog', { name: 'Changelog History' })).toBeInTheDocument();
    expect(screen.getByText('Private accounts and secure progress sync')).toBeInTheDocument();
    expect(screen.getByText('Player shortcuts from every page')).toBeInTheDocument();
    expect(screen.getByText('Theme-safe surfaces across Quiz Arcade')).toBeInTheDocument();
    expect(screen.getByText('Official-first library and historical deployment archive')).toBeInTheDocument();
    expect(screen.getByText('Arcade Academy and realistic certification practice')).toBeInTheDocument();
    expect(screen.getByText('Quiz Arcade identity and safer releases')).toBeInTheDocument();
    expect(screen.getByText('Study plans get a proper front door')).toBeInTheDocument();
    expect(screen.getByText('Smart study loop and accessible themes')).toBeInTheDocument();
    expect(screen.getByText('11 releases recorded')).toBeInTheDocument();
    expect(screen.getAllByText('Previously unversioned')).toHaveLength(4);
  });

  it('dismisses the popup with Escape and records the release as read', async () => {
    render(<ChangelogExperience />);

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(CHANGELOG_STORAGE_KEY)).toContain(APP_VERSION);
  });

  it('keeps privacy, terms, and community guidelines in the footer', () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, JSON.stringify({ version: 1, readVersions: [APP_VERSION] }));
    render(<ChangelogExperience />);

    expect(screen.getByRole('button', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terms' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guidelines' })).toBeInTheDocument();
    expect(screen.getByText(/Guest progress is not saved/)).toBeInTheDocument();
  });
});
