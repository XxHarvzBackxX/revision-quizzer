import { useState } from 'react';
import { APP_VERSION, changelogEntries, changelogEntryKey, currentChangelog, getLatestUnreadChangelog, markChangelogRead, type ChangelogEntry } from '../changelog';
import { ChangelogModal } from './ChangelogModal';
import { useOptionalAccount } from '../account/AccountContext';

type ChangelogView =
  | { mode: 'latest'; entry: ChangelogEntry }
  | { mode: 'history' };

export function ChangelogExperience() {
  const account = useOptionalAccount();
  const [view, setView] = useState<ChangelogView | null>(() => {
    const unread = getLatestUnreadChangelog();
    return unread ? { mode: 'latest', entry: unread } : null;
  });

  function dismiss() {
    if (view?.mode === 'latest') markChangelogRead(changelogEntryKey(view.entry));
    else if (currentChangelog) markChangelogRead(changelogEntryKey(currentChangelog));
    setView(null);
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <>
      <footer className="site-footer">
        <div>
          <span className="site-footer-brand" aria-label={`Quiz Arcade version ${APP_VERSION}`}>Quiz Arcade <strong>v{APP_VERSION}</strong></span>
          <small>Unofficial certification preparation · {account ? 'Progress syncs to your private account' : 'Guest progress is not saved'}</small>
        </div>
        <nav aria-label="Legal and release information"><button onClick={() => navigate('/privacy')}>Privacy</button><button onClick={() => navigate('/terms')}>Terms</button><button onClick={() => navigate('/community-guidelines')}>Guidelines</button><button onClick={() => setView({ mode: 'history' })}>Changelog History</button></nav>
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
