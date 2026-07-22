import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccountInputError, accountRef, handleRef, isReservedHandle, toAccountProfile, touchAccount } from '../_account.js';
import { requireProtectedRequest, requireUser, verifyFreshIdToken } from '../_auth.js';
import { getDatabase } from '../_firebase.js';
import { isAccountAvatar, normalizeHandle } from '../../shared/account.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

const HANDLE_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    if (request.method === 'GET') {
      const user = await requireUser(request, response);
      if (!user) return;
      const account = await accountRef(user.uid).get();
      if (!account.exists) {
        sendJson(response, 409, { error: 'Complete account setup by signing in again.', code: 'onboarding_required' });
        return;
      }
      await touchAccount(user.uid, account.data() ?? {});
      sendJson(response, 200, { account: toAccountProfile(user.uid, account.data() ?? {}, user.admin) });
      return;
    }

    if (request.method === 'PATCH') {
      if (!await requireProtectedRequest(request, response)) return;
      const user = await requireUser(request, response);
      if (!user) return;
      await updateProfile(request, response, user.uid, user.admin);
      return;
    }

    sendMethodNotAllowed(response, ['GET', 'PATCH']);
  } catch (error) {
    if (error instanceof AccountInputError) {
      sendJson(response, 409, { error: error.message, code: error.code });
      return;
    }
    sendServerError(response, error);
  }
}

async function updateProfile(request: VercelRequest, response: VercelResponse, uid: string, admin: boolean) {
  const body = await readJsonBody(request);
  if (!isRecord(body)) {
    sendJson(response, 400, { error: 'Profile changes must be a JSON object.' });
    return;
  }
  const database = getDatabase();
  await database.runTransaction(async (transaction) => {
    const ref = accountRef(uid);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new AccountInputError('Account not found.', 'account_not_found');
    const current = snapshot.data() ?? {};
    const updates: Record<string, unknown> = {};

    if ('avatar' in body) {
      if (!isAccountAvatar(body.avatar)) throw new AccountInputError('Choose one of the supplied avatars.', 'invalid_avatar');
      updates.avatar = body.avatar;
    }
    if ('attributionEnabled' in body) updates.attributionEnabled = body.attributionEnabled === true;

    if ('handle' in body) {
      const nextHandle = normalizeHandle(body.handle);
      if (!nextHandle) throw new AccountInputError('Use 3–24 lowercase letters, numbers, or underscores.', 'invalid_handle');
      if (isReservedHandle(nextHandle)) throw new AccountInputError('That handle is reserved.', 'handle_reserved');
      if (nextHandle !== current.handle) {
        const fresh = await verifyFreshIdToken(request, uid);
        if (!fresh) throw new AccountInputError('Sign in again before changing your handle.', 'recent_auth_required');
        const changedAt = toDate(current.handleChangedAt);
        if (changedAt && Date.now() - changedAt.getTime() < HANDLE_CHANGE_COOLDOWN_MS) {
          throw new AccountInputError('Handles can be changed once every 30 days.', 'handle_cooldown');
        }
        const nextRef = handleRef(nextHandle);
        const next = await transaction.get(nextRef);
        if (next.exists) throw new AccountInputError('That handle is already taken.', 'handle_taken');
        transaction.create(nextRef, { uid, createdAt: Timestamp.now() });
        if (typeof current.handle === 'string') transaction.delete(handleRef(current.handle));
        updates.handle = nextHandle;
        updates.handleChangedAt = Timestamp.now();
      }
    }
    updates.updatedAt = FieldValue.serverTimestamp();
    transaction.set(ref, updates, { merge: true });
  });
  const account = await accountRef(uid).get();
  const accountData = account.data() ?? {};
  if ('handle' in body || 'avatar' in body || 'attributionEnabled' in body) {
    const datasets = await getDatabase().collection('datasets').where('creatorUid', '==', uid).limit(250).get();
    const writer = getDatabase().bulkWriter();
    for (const dataset of datasets.docs) {
      if (accountData.attributionEnabled === true && typeof accountData.handle === 'string' && typeof accountData.avatar === 'string') {
        writer.update(dataset.ref, { attributionEnabled: true, creator: { handle: accountData.handle, avatar: accountData.avatar } });
      } else {
        writer.update(dataset.ref, { attributionEnabled: false, creator: FieldValue.delete() });
      }
    }
    await writer.close();
  }
  sendJson(response, 200, { account: toAccountProfile(uid, accountData, admin) });
}

function toDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate() as Date;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
