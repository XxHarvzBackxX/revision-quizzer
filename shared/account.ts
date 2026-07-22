export const TERMS_VERSION = '2026-07-22';
export const PRIVACY_VERSION = '2026-07-22';
export const SESSION_DURATION_DAYS = 5;

export const ACCOUNT_AVATARS = [
  'astro-owl',
  'cloud-fox',
  'pixel-cat',
  'quiz-bot',
  'study-dragon',
  'trophy-panda'
] as const;

export type AccountAvatar = typeof ACCOUNT_AVATARS[number];

export type AccountProfile = {
  uid: string;
  email: string;
  handle: string;
  avatar: AccountAvatar;
  attributionEnabled: boolean;
  admin: boolean;
  createdAt: string;
  handleChangedAt?: string;
};

export type AdminAccountProfile = AccountProfile & {
  status: 'active' | 'suspended' | 'deleting';
  disabled: boolean;
  emailVerified: boolean;
  providers: string[];
  lastActiveAt?: string;
  lastSignInAt?: string;
};

export type AdminAccountUpdate = {
  uid: string;
  reason: string;
  handle?: string;
  avatar?: AccountAvatar;
  attributionEnabled?: false;
};

export type AdminAccountAction = {
  uid: string;
  reason: string;
  action: 'revoke-sessions' | 'suspend' | 'restore';
};

export type AdminModerationChanges = Partial<Record<'handle' | 'avatar' | 'attributionEnabled', string | boolean | null>>;

export type AdminModerationEvent = {
  id: string;
  action: 'account.profile_updated' | 'account.revoke-sessions' | 'account.suspend' | 'account.restore';
  actor: {
    uid: string;
    handle: string;
  };
  targetUid: string;
  reason: string;
  createdAt: string;
  before?: AdminModerationChanges;
  after?: AdminModerationChanges;
};

export type AccountOnboarding = {
  handle: string;
  avatar: AccountAvatar;
  isAtLeast16: true;
  acceptsTerms: true;
  acknowledgesPrivacy: true;
};

export const ACCOUNT_DOMAINS = ['quiz', 'study', 'revision', 'preferences'] as const;
export type AccountDomain = typeof ACCOUNT_DOMAINS[number];

export type AccountDomainState = {
  domain: AccountDomain;
  revision: number;
  updatedAt: string;
  data: Record<string, unknown>;
};

export type AccountDataBundle = Partial<Record<AccountDomain, AccountDomainState>>;

export function normalizeHandle(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9_]{3,24}$/.test(normalized) ? normalized : null;
}

export function isAccountAvatar(value: unknown): value is AccountAvatar {
  return typeof value === 'string' && ACCOUNT_AVATARS.includes(value as AccountAvatar);
}

export function isAccountDomain(value: unknown): value is AccountDomain {
  return typeof value === 'string' && ACCOUNT_DOMAINS.includes(value as AccountDomain);
}
