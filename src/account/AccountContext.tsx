import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AccountDataBundle, AccountDomain, AccountProfile } from '../../shared/account';
import { fetchAccount, fetchAccountData, signOutSession, syncAccountDomain } from '../api';
import { getFirebaseAuthClient, isFirebaseConfigured } from '../firebase';
import {
  ACCOUNT_STORAGE_EVENT,
  configureAccountPersistence,
  configureGuestPersistence,
  getAccountDomainSnapshot,
  hydrateAccountData,
  purgeAccountCache
} from '../persistence';

type AccountContextValue = {
  account: AccountProfile | null;
  loading: boolean;
  authAvailable: boolean;
  activate: (account: AccountProfile) => Promise<void>;
  refreshProfile: () => Promise<void>;
  reloadData: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const SESSION_PROFILE_KEY = 'quiz-arcade:active-account:v1';

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const revisions = useRef<Record<AccountDomain, number>>({ quiz: 0, study: 0, revision: 0, preferences: 0, review: 0 });
  const timers = useRef<Partial<Record<AccountDomain, number>>>({});
  const syncOperations = useRef<Partial<Record<AccountDomain, Promise<void>>>>({});

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    function onStorage(event: Event) {
      if (!account) return;
      const domain = (event as CustomEvent<{ domain?: AccountDomain }>).detail?.domain;
      if (!domain) return;
      const currentTimer = timers.current[domain];
      if (currentTimer) window.clearTimeout(currentTimer);
      timers.current[domain] = window.setTimeout(() => {
        delete timers.current[domain];
        void sync(domain);
      }, 700);
    }
    window.addEventListener(ACCOUNT_STORAGE_EVENT, onStorage);
    return () => {
      window.removeEventListener(ACCOUNT_STORAGE_EVENT, onStorage);
      Object.values(timers.current).forEach((timer) => timer && window.clearTimeout(timer));
    };
  }, [account?.uid]);

  async function initialize() {
    try {
      const current = await fetchAccount();
      if (current) await activate(current);
      else {
        sessionStorage.removeItem(SESSION_PROFILE_KEY);
        configureGuestPersistence();
      }
    } catch (error) {
      console.error('Account initialization failed', error);
      const cached = readCachedProfile();
      if (cached) {
        configureAccountPersistence(cached.uid);
        setAccount(cached);
      } else configureGuestPersistence();
    } finally {
      setLoading(false);
    }
  }

  async function loadData(profile: AccountProfile): Promise<AccountDataBundle> {
    const bundle = await fetchAccountData();
    for (const domain of Object.keys(revisions.current) as AccountDomain[]) {
      revisions.current[domain] = bundle[domain]?.revision ?? 0;
    }
    hydrateAccountData(profile.uid, bundle);
    return bundle;
  }

  async function activate(profile: AccountProfile): Promise<void> {
    setLoading(true);
    await loadData(profile);
    sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
    setAccount(profile);
    setLoading(false);
  }

  async function reloadData(): Promise<void> {
    if (account) await loadData(account);
  }

  async function refreshProfile(): Promise<void> {
    const next = await fetchAccount();
    setAccount(next);
  }

  async function sync(domain: AccountDomain): Promise<void> {
    if (!account) return;
    const operation = (async () => {
      try {
        revisions.current[domain] = await syncAccountDomain(domain, getAccountDomainSnapshot(domain), revisions.current[domain]);
        window.dispatchEvent(new CustomEvent('quiz-arcade:account-sync', { detail: { domain, ok: true } }));
      } catch (error) {
        console.error('Account sync failed', { domain, error });
        window.dispatchEvent(new CustomEvent('quiz-arcade:account-sync', { detail: { domain, ok: false } }));
        try {
          await reloadData();
        } catch (reloadError) {
          console.error('Account conflict reload failed', reloadError);
        }
      }
    })();
    syncOperations.current[domain] = operation;
    await operation;
    if (syncOperations.current[domain] === operation) delete syncOperations.current[domain];
  }

  async function flushPendingSyncs(): Promise<void> {
    const domains = [...new Set([
      ...Object.keys(timers.current),
      ...Object.keys(syncOperations.current)
    ] as AccountDomain[])];
    for (const domain of domains) {
      const timer = timers.current[domain];
      if (timer) window.clearTimeout(timer);
      delete timers.current[domain];
      const activeSync = syncOperations.current[domain];
      if (activeSync) await activeSync;
      await sync(domain);
    }
  }

  async function signOut(): Promise<void> {
    const uid = account?.uid;
    await flushPendingSyncs();
    await signOutSession();
    if (isFirebaseConfigured()) {
      try {
        await (await getFirebaseAuthClient()).signOut();
      } catch {
        // The server cookie is authoritative and has already been cleared.
      }
    }
    if (uid) purgeAccountCache(uid);
    configureGuestPersistence();
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
    setAccount(null);
  }

  return (
    <AccountContext.Provider value={{ account, loading, authAvailable: isFirebaseConfigured(), activate, refreshProfile, reloadData, signOut }}>
      {loading ? <main className="account-loading" aria-live="polite">Loading your secure session…</main> : children}
    </AccountContext.Provider>
  );
}

function readCachedProfile(): AccountProfile | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_PROFILE_KEY) ?? 'null') as unknown;
    return value && typeof value === 'object' && 'uid' in value && typeof value.uid === 'string' ? value as AccountProfile : null;
  } catch {
    return null;
  }
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider.');
  return value;
}

export function useOptionalAccount(): AccountProfile | null {
  return useContext(AccountContext)?.account ?? null;
}
