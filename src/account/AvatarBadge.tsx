import type { AccountAvatar } from '../../shared/account';

const AVATAR_GLYPHS: Record<AccountAvatar, string> = {
  'astro-owl': '🦉',
  'cloud-fox': '🦊',
  'pixel-cat': '🐱',
  'quiz-bot': '🤖',
  'study-dragon': '🐲',
  'trophy-panda': '🐼'
};

export function AvatarBadge({ avatar, label, size = 'normal' }: { avatar: AccountAvatar; label?: string; size?: 'normal' | 'large' }) {
  return <span className={`account-avatar ${size}`} role="img" aria-label={label ?? avatar.replaceAll('-', ' ')}>{AVATAR_GLYPHS[avatar]}</span>;
}
