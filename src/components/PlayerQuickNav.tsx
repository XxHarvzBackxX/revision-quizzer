import { ChevronRight, Gamepad2, LogIn, Settings, UserRound } from 'lucide-react';
import { useOptionalAccount } from '../account/AccountContext';
import { AvatarBadge } from '../account/AvatarBadge';
import type { AppRoute, Navigate } from '../types';

export function PlayerQuickNav({ route, navigate }: { route: AppRoute; navigate: Navigate }) {
  const account = useOptionalAccount();
  const onStudyRoute = route.name.startsWith('study') && route.name !== 'study-profile';
  const onProfileRoute = route.name === 'study-profile';

  function open(path: string, button: HTMLButtonElement) {
    navigate(path);
    button.closest('details')?.removeAttribute('open');
  }

  return (
    <details className={route.name.startsWith('study') || route.name === 'account' ? 'player-quick-nav active' : 'player-quick-nav'}>
      <summary aria-label="Open player shortcuts" aria-haspopup="true" title="Player and account shortcuts">
        {account ? <AvatarBadge avatar={account.avatar} label={`${account.handle} account`} /> : <UserRound size={20} aria-hidden="true" />}
      </summary>
      <nav className="player-quick-menu" aria-label="Player shortcuts">
        <div className="player-quick-heading"><span>Player shortcuts</span><small>Jump back in</small></div>
        <button
          className={route.name === 'account' || route.name === 'login' || route.name === 'register' ? 'active' : ''}
          aria-current={route.name === 'account' ? 'page' : undefined}
          onClick={(event) => open(account ? '/account' : '/login', event.currentTarget)}
        >
          <span className="player-quick-icon">{account ? <Settings size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}</span>
          <span><strong>{account ? `@${account.handle}` : 'Sign in'}</strong><small>{account ? 'Manage profile, data, and session' : 'Save progress across devices'}</small></span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button
          className={onStudyRoute ? 'active' : ''}
          aria-current={onStudyRoute ? 'location' : undefined}
          onClick={(event) => open('/study', event.currentTarget)}
        >
          <span className="player-quick-icon"><Gamepad2 size={18} aria-hidden="true" /></span>
          <span><strong>Study &amp; Academy</strong><small>Open your plans and campaigns</small></span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button
          className={onProfileRoute ? 'active' : ''}
          aria-current={onProfileRoute ? 'page' : undefined}
          onClick={(event) => open('/study/profile', event.currentTarget)}
        >
          <span className="player-quick-icon"><UserRound size={18} aria-hidden="true" /></span>
          <span><strong>Player profile</strong><small>View progress and rewards</small></span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </details>
  );
}
