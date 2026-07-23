import type { AccountDataBundle, AccountDomain } from '../shared/account';

export const ACCOUNT_STORAGE_EVENT = 'quiz-arcade:account-storage-changed';

const DOMAIN_KEYS: Record<AccountDomain, readonly string[]> = {
  quiz: ['quiz-arcade:attempts:v2', 'quiz-arcade:active-exams:v1', 'quiz-arcade:scores'],
  study: ['quiz-arcade:study:v2', 'quiz-arcade:study:v1'],
  revision: ['quiz-arcade:revision:v1'],
  preferences: ['quiz-arcade:theme:v1', 'quiz-arcade:changelog:v1']
};

let accountUid: string | null = null;
const guestMemory = new Map<string, string>();
let runtimePolicyActive = import.meta.env.MODE !== 'test';

export function configureGuestPersistence(): void {
  runtimePolicyActive = true;
  accountUid = null;
  guestMemory.clear();
}

export function configureAccountPersistence(uid: string): void {
  runtimePolicyActive = true;
  accountUid = uid;
  guestMemory.clear();
}

export function readAppStorage(key: string): string | null {
  if (!runtimePolicyActive) return localStorage.getItem(key);
  if (!accountUid) return guestMemory.get(key) ?? null;
  return localStorage.getItem(accountKey(accountUid, key));
}

export function writeAppStorage(key: string, value: string): void {
  if (!runtimePolicyActive) {
    localStorage.setItem(key, value);
    return;
  }
  if (!accountUid) {
    guestMemory.set(key, value);
    return;
  }
  localStorage.setItem(accountKey(accountUid, key), value);
  const domain = domainForKey(key);
  if (domain) window.dispatchEvent(new CustomEvent(ACCOUNT_STORAGE_EVENT, { detail: { domain } }));
}

export function removeAppStorage(key: string): void {
  if (!runtimePolicyActive) {
    localStorage.removeItem(key);
    return;
  }
  if (!accountUid) guestMemory.delete(key);
  else localStorage.removeItem(accountKey(accountUid, key));
}

export function hydrateAccountData(uid: string, bundle: AccountDataBundle): void {
  configureAccountPersistence(uid);
  for (const domain of Object.keys(DOMAIN_KEYS) as AccountDomain[]) {
    const data = bundle[domain]?.data ?? {};
    for (const key of DOMAIN_KEYS[domain]) {
      const value = data[key];
      if (value === undefined) localStorage.removeItem(accountKey(uid, key));
      else localStorage.setItem(accountKey(uid, key), JSON.stringify(value));
    }
  }
}

export function getAccountDomainSnapshot(domain: AccountDomain): Record<string, unknown> {
  if (!accountUid) return {};
  return Object.fromEntries(DOMAIN_KEYS[domain].flatMap((key) => {
    const raw = localStorage.getItem(accountKey(accountUid!, key));
    if (!raw) return [];
    try {
      return [[key, JSON.parse(raw) as unknown]];
    } catch {
      return [];
    }
  }));
}

export function collectLegacyProgress(): Record<AccountDomain, Record<string, unknown>> | null {
  const domains = Object.fromEntries((Object.keys(DOMAIN_KEYS) as AccountDomain[]).map((domain) => [
    domain,
    Object.fromEntries(DOMAIN_KEYS[domain].flatMap((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      try {
        return [[key, JSON.parse(raw) as unknown]];
      } catch {
        return [];
      }
    }))
  ])) as Record<AccountDomain, Record<string, unknown>>;
  return Object.values(domains).some((domain) => Object.keys(domain).length > 0) ? domains : null;
}

export function clearLegacyProgress(): void {
  Object.values(DOMAIN_KEYS).flat().forEach((key) => localStorage.removeItem(key));
}

export function purgeAccountCache(uid: string): void {
  Object.values(DOMAIN_KEYS).flat().forEach((key) => localStorage.removeItem(accountKey(uid, key)));
  if (accountUid === uid) configureGuestPersistence();
}

export function activeAccountUid(): string | null {
  return accountUid;
}

export function resetPersistenceForTests(): void {
  if (import.meta.env.MODE !== 'test') return;
  runtimePolicyActive = false;
  accountUid = null;
  guestMemory.clear();
}

function accountKey(uid: string, key: string): string {
  return `quiz-arcade:account:${uid}:${key}`;
}

function domainForKey(key: string): AccountDomain | null {
  return (Object.keys(DOMAIN_KEYS) as AccountDomain[]).find((domain) => DOMAIN_KEYS[domain].includes(key)) ?? null;
}
