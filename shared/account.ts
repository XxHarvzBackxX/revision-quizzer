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
