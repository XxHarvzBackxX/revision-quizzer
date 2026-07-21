import { useState } from 'react';
import { APP_VERSION, changelogEntries, currentChangelog, getLatestUnreadChangelog, markChangelogRead, type ChangelogEntry } from '../changelog';
import { ChangelogModal } from './ChangelogModal';

type ChangelogView =
  | { mode: 'latest'; entry: ChangelogEntry }
  | { mode: 'history' };

export function ChangelogExperience() {
  const [view, setView] = useState<ChangelogView | null>(() => {
    const unread = getLatestUnreadChangelog();
    return unread ? { mode: 'latest', entry: unread } : null;
  });

  function dismiss() {
    if (view?.mode === 'latest') markChangelogRead(view.entry.version);
    else if (currentChangelog) markChangelogRead(currentChangelog.version);
    setView(null);
  }

  return (
    <>
      <footer className="site-footer">
        <div>
          <span className="site-footer-brand" aria-label={`Quiz Arcade version ${APP_VERSION}`}>Quiz Arcade <strong>v{APP_VERSION}</strong></span>
          <small>Unofficial certification preparation · Progress stays in this browser</small>
        </div>
        <button onClick={() => setView({ mode: 'history' })}>Changelog History</button>
      </footer>
      {view && (
        <ChangelogModal
          mode={view.mode}
          entries={view.mode === 'latest' ? [view.entry] : changelogEntries}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}
