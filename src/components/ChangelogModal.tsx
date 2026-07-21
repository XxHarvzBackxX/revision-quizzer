import { useEffect, useId, useRef } from 'react';
import { CalendarDays, Check, History, Sparkles, X } from 'lucide-react';
import { APP_VERSION, formatChangelogDate, type ChangelogEntry } from '../changelog';

export function ChangelogModal({ mode, entries, onDismiss }: {
  mode: 'latest' | 'history';
  entries: ChangelogEntry[];
  onDismiss: () => void;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div className="changelog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onDismiss();
    }}>
      <div className="changelog-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialog}>
        <header className="changelog-dialog-header">
          <span className="changelog-dialog-icon">{mode === 'latest' ? <Sparkles size={25} /> : <History size={25} />}</span>
          <div>
            <span className="changelog-kicker">{mode === 'latest' ? 'New release' : `Quiz Arcade v${APP_VERSION}`}</span>
            <h2 id={titleId}>{mode === 'latest' ? 'What’s new in Quiz Arcade' : 'Changelog History'}</h2>
            <p>{mode === 'latest' ? 'Here is what changed since your last visit.' : 'Every published Quiz Arcade release, newest first.'}</p>
          </div>
          <button className="changelog-close" onClick={onDismiss} aria-label={mode === 'latest' ? 'Dismiss changelog' : 'Close changelog history'}><X size={20} /></button>
        </header>

        <div className="changelog-scroll">
          {entries.map((entry) => <ReleaseEntry entry={entry} current={entry.version === APP_VERSION} key={entry.version} />)}
        </div>

        <footer className="changelog-dialog-footer">
          <span><Check size={16} /> {mode === 'latest' ? 'This release will not open automatically again.' : `${entries.length} release${entries.length === 1 ? '' : 's'} recorded`}</span>
          <button className="primary-button" onClick={onDismiss}>{mode === 'latest' ? 'Got it' : 'Close history'}</button>
        </footer>
      </div>
    </div>
  );
}

function ReleaseEntry({ entry, current }: { entry: ChangelogEntry; current: boolean }) {
  return (
    <article className="changelog-release">
      <div className="changelog-release-heading">
        <span className="changelog-version">v{entry.version}</span>
        {current && <span className="changelog-current">Current</span>}
        <span className="changelog-date"><CalendarDays size={14} /> {formatChangelogDate(entry.releasedAt)}</span>
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>
      <div className="changelog-sections">
        {entry.sections.map((section) => (
          <section key={section.title}>
            <h4>{section.title}</h4>
            <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ))}
      </div>
    </article>
  );
}
