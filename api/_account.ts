import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import {
  ACCOUNT_DOMAINS,
  PRIVACY_VERSION,
  TERMS_VERSION,
  isAccountAvatar,
  isAccountDomain,
  normalizeHandle,
  type AccountDataBundle,
  type AccountDomain,
  type AccountDomainState,
  type AccountOnboarding,
  type AccountProfile
} from '../shared/account.js';
import { getDatabase, getFirebaseAuth } from './_firebase.js';

const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'moderator', 'quiz_arcade', 'quizarcade', 'staff', 'support', 'system', 'unknown'
]);
const MAX_DOMAIN_BYTES = 350_000;
const MAX_CLAIM_IDS = 10;

export function accountRef(uid: string) {
  return getDatabase().collection('accounts').doc(uid);
}

export function accountDataRef(uid: string, domain: AccountDomain) {
  return accountRef(uid).collection('data').doc(domain);
}

export function handleRef(handle: string) {
  return getDatabase().collection('handles').doc(handle);
}

export function validateOnboarding(value: unknown): { ok: true; value: AccountOnboarding } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'Account setup details are required.' };
  const handle = normalizeHandle(value.handle);
  if (!handle) return { ok: false, error: 'Use 3–24 lowercase letters, numbers, or underscores for your handle.' };
  if (RESERVED_HANDLES.has(handle)) return { ok: false, error: 'That handle is reserved.' };
  if (!isAccountAvatar(value.avatar)) return { ok: false, error: 'Choose one of the supplied avatars.' };
  if (value.isAtLeast16 !== true) return { ok: false, error: 'Accounts are available only to people aged 16 or over.' };
  if (value.acceptsTerms !== true || value.acknowledgesPrivacy !== true) {
    return { ok: false, error: 'Review the Terms and Privacy Policy before creating an account.' };
  }
  return { ok: true, value: { handle, avatar: value.avatar, isAtLeast16: true, acceptsTerms: true, acknowledgesPrivacy: true } };
}

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle);
}

export async function createAccount(uid: string, email: string, onboarding: AccountOnboarding): Promise<void> {
  const database = getDatabase();
  await database.runTransaction(async (transaction) => {
    const account = accountRef(uid);
    const handle = handleRef(onboarding.handle);
    const [accountSnapshot, handleSnapshot] = await Promise.all([transaction.get(account), transaction.get(handle)]);
    if (accountSnapshot.exists) return;
    if (handleSnapshot.exists) throw new AccountInputError('That handle is already taken.', 'handle_taken');

    const now = Timestamp.now();
    transaction.create(handle, { uid, createdAt: now });
    transaction.create(account, {
      email,
      handle: onboarding.handle,
      avatar: onboarding.avatar,
      attributionEnabled: false,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      ageConfirmedAt: now,
      createdAt: now,
      lastActiveAt: now,
      schemaVersion: 1,
      status: 'active',
      claimIds: []
    });
  });
}

export function toAccountProfile(uid: string, data: DocumentData, admin: boolean): AccountProfile {
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    handle: typeof data.handle === 'string' ? data.handle : '',
    avatar: isAccountAvatar(data.avatar) ? data.avatar : 'quiz-bot',
    attributionEnabled: data.attributionEnabled === true,
    admin,
    createdAt: toIso(data.createdAt),
    ...(data.handleChangedAt ? { handleChangedAt: toIso(data.handleChangedAt) } : {})
  };
}

export async function touchAccount(uid: string, data: DocumentData): Promise<void> {
  const lastActive = toDate(data.lastActiveAt);
  if (!lastActive || Date.now() - lastActive.getTime() >= 24 * 60 * 60 * 1000) {
    await accountRef(uid).set({ lastActiveAt: Timestamp.now(), inactivityWarningSentAt: FieldValue.delete() }, { merge: true });
  }
}

export function validateDomainPayload(domain: unknown, data: unknown): { domain: AccountDomain; data: Record<string, unknown> } | null {
  if (!isAccountDomain(domain) || !isRecord(data)) return null;
  const serialized = JSON.stringify(data);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_DOMAIN_BYTES || !isSafeJson(data, 0)) return null;
  if (domain === 'quiz' && arrayLength(data.attempts) > 80) return null;
  if (domain === 'quiz' && arrayLength(data.activeExams) > 8) return null;
  return { domain, data };
}

export async function getAccountData(uid: string): Promise<AccountDataBundle> {
  const snapshots = await Promise.all(ACCOUNT_DOMAINS.map((domain) => accountDataRef(uid, domain).get()));
  return Object.fromEntries(snapshots.flatMap((snapshot, index) => {
    if (!snapshot.exists) return [];
    const domain = ACCOUNT_DOMAINS[index];
    const data = snapshot.data() ?? {};
    return [[domain, {
      domain,
      revision: typeof data.revision === 'number' ? data.revision : 0,
      updatedAt: toIso(data.updatedAt),
      data: isRecord(data.data) ? data.data : {}
    } satisfies AccountDomainState]];
  })) as AccountDataBundle;
}

export async function deleteAccount(uid: string, approvedContent: 'anonymize' | 'delete'): Promise<void> {
  const database = getDatabase();
  const account = await accountRef(uid).get();
  const handle = typeof account.data()?.handle === 'string' ? account.data()?.handle as string : '';
  if (account.exists) await account.ref.set({ status: 'deleting', deletionStartedAt: Timestamp.now(), deletionApprovedContent: approvedContent }, { merge: true });
  const datasets = await database.collection('datasets').where('creatorUid', '==', uid).limit(250).get();
  const writer = database.bulkWriter();
  for (const dataset of datasets.docs) {
    const data = dataset.data();
    if (approvedContent === 'delete' || data.status !== 'approved') {
      writer.delete(dataset.ref);
    } else {
      writer.update(dataset.ref, {
        creatorUid: FieldValue.delete(),
        creator: FieldValue.delete(),
        attributionEnabled: false
      });
    }
  }
  await writer.close();
  if (handle) {
    const reserved = await handleRef(handle).get();
    if (reserved.data()?.uid === uid) await reserved.ref.delete();
  }
  try {
    await getFirebaseAuth().revokeRefreshTokens(uid);
    await getFirebaseAuth().deleteUser(uid);
  } catch (error) {
    if (!isFirebaseUserMissing(error)) throw error;
  }
  await database.recursiveDelete(accountRef(uid));
}

export function normalizeClaimId(value: unknown): string | null {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(value) ? value : null;
}

export function hasClaimId(data: DocumentData, claimId: string): boolean {
  return Array.isArray(data.claimIds) && data.claimIds.includes(claimId);
}

export function nextClaimIds(data: DocumentData, claimId: string): string[] {
  const current = Array.isArray(data.claimIds) ? data.claimIds.filter((entry): entry is string => typeof entry === 'string') : [];
  return [...current.filter((entry) => entry !== claimId), claimId].slice(-MAX_CLAIM_IDS);
}

export class AccountInputError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

function isSafeJson(value: unknown, depth: number): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 2_000 && value.every((entry) => isSafeJson(entry, depth + 1));
  if (!isRecord(value) || Object.keys(value).length > 2_000) return false;
  return Object.entries(value).every(([key, entry]) => key.length <= 160 && isSafeJson(entry, depth + 1));
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function toDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate() as Date;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function toIso(value: unknown): string {
  return toDate(value)?.toISOString() ?? new Date(0).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFirebaseUserMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/user-not-found';
}
