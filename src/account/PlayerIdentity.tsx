import { ChevronRight } from 'lucide-react';
import type { AccountProfile } from '../../shared/account';
import { AvatarBadge } from './AvatarBadge';

export function PlayerIdentity({
  account,
  label,
  actionLabel,
  className = '',
  tone = 'default',
  onOpen
}: {
  account: AccountProfile | null;
  label?: string;
  actionLabel?: string;
  className?: string;
  tone?: 'default' | 'inverse';
  onOpen?: () => void;
}) {
  if (!account) return null;
  const classes = ['player-identity', tone === 'inverse' ? 'inverse' : '', className].filter(Boolean).join(' ');
  const content = <>
    <AvatarBadge avatar={account.avatar} label={`${account.handle} avatar`} />
    <span className="player-identity-copy">
      <small>{label ?? (account.admin ? 'Administrator' : 'Signed-in player')}</small>
      <strong>@{account.handle}</strong>
    </span>
    {onOpen && <span className="player-identity-action">{actionLabel ?? 'Profile'} <ChevronRight size={15} aria-hidden="true" /></span>}
  </>;

  return onOpen
    ? <button type="button" className={classes} aria-label={`Open @${account.handle} ${(actionLabel ?? 'profile').toLowerCase()}`} onClick={onOpen}>{content}</button>
    : <div className={classes}>{content}</div>;
}
