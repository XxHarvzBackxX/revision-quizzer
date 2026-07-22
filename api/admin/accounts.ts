import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  isAccountAvatar,
  type AdminAccountProfile,
  type AdminAccountUpdate,
  type AdminModerationChanges,
  type AdminModerationEvent
} from '../../shared/account.js';
import {
  AccountInputError,
  accountRef,
  handleRef,
  validateAdminAccountAction,
  validateAdminAccountUpdate
} from '../_account.js';
import { requireAdmin, requireProtectedRequest } from '../_auth.js';
import { getDatabase, getFirebaseAuth } from '../_firebase.js';
import { getQueryParam, readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

const PAGE_SIZE = 50;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const administrator = await requireAdmin(request, response);
  if (!administrator) return;

  try {
    if (request.method === 'GET') {
      const historyUid = getQueryParam(request, 'history').trim();
      if (historyUid) {
        if (!isFirebaseUid(historyUid)) {
          sendJson(response, 400, { error: 'A valid account UID is required for moderation history.' });
          return;
        }
        await listModerationHistory(historyUid, getQueryParam(request, 'cursor').trim(), response);
        return;
      }
      await listAccounts(request, response);
      return;
    }

    if (request.method === 'PATCH') {
      if (!await requireProtectedRequest(request, response)) return;
      const update = validateAdminAccountUpdate(await readJsonBody(request));
      if (!update) {
        sendJson(response, 400, { error: 'Provide a valid profile change and a moderation reason of 5–300 characters.' });
        return;
      }
      const account = await updateAccountProfile(update, administrator.uid);
      sendJson(response, 200, { account });
      return;
    }

    if (request.method === 'POST') {
      if (!await requireProtectedRequest(request, response)) return;
      const action = validateAdminAccountAction(await readJsonBody(request));
      if (!action) {
        sendJson(response, 400, { error: 'Provide a valid account action and a moderation reason of 5–300 characters.' });
        return;
      }
      if (action.action === 'suspend' && action.uid === administrator.uid) {
        sendJson(response, 400, { error: 'You cannot suspend your own administrator account.' });
        return;
      }
      const account = await applyAccountAction(action.uid, action.action, action.reason, administrator.uid);
      sendJson(response, 200, { account });
      return;
    }

    sendMethodNotAllowed(response, ['GET', 'PATCH', 'POST']);
  } catch (error) {
    if (error instanceof AccountInputError) {
      sendJson(response, 409, { error: error.message, code: error.code });
      return;
    }
    sendServerError(response, error);
  }
}

async function listModerationHistory(uid: string, cursor: string, response: VercelResponse) {
  const collection = accountRef(uid).collection('moderationAudit');
  let query = collection.orderBy('createdAt', 'desc').limit(PAGE_SIZE + 1);
  if (cursor && isDocumentId(cursor)) {
    const cursorDocument = await collection.doc(cursor).get();
    if (cursorDocument.exists) query = query.startAfter(cursorDocument);
  }
  const snapshot = await query.get();
  const documents = snapshot.docs.slice(0, PAGE_SIZE);
  const actorUids = [...new Set(documents.flatMap((document) => {
    const actorUid = document.data().actorUid;
    return typeof actorUid === 'string' && isFirebaseUid(actorUid) ? [actorUid] : [];
  }))];
  const actorDocuments = actorUids.length ? await getDatabase().getAll(...actorUids.map(accountRef)) : [];
  const actorHandles = new Map(actorDocuments.map((document) => [document.id, typeof document.data()?.handle === 'string' ? document.data()!.handle as string : 'former_admin']));
  const events = documents.map((document) => toModerationEvent(uid, document.id, document.data(), actorHandles));
  const nextCursor = snapshot.docs.length > PAGE_SIZE ? snapshot.docs[PAGE_SIZE - 1].id : null;
  sendJson(response, 200, { events, nextCursor });
}

async function listAccounts(request: VercelRequest, response: VercelResponse) {
  const search = getQueryParam(request, 'q').trim();
  const cursor = getQueryParam(request, 'cursor').trim();
  const collection = getDatabase().collection('accounts');
  let documents: AccountDocument[];
  let nextCursor: string | null = null;

  if (search) {
    documents = await searchAccounts(search);
  } else {
    let query = collection.orderBy('createdAt', 'desc').limit(PAGE_SIZE + 1);
    if (cursor && isFirebaseUid(cursor)) {
      const cursorDocument = await accountRef(cursor).get();
      if (cursorDocument.exists) query = query.startAfter(cursorDocument);
    }
    const snapshot = await query.get();
    nextCursor = snapshot.docs.length > PAGE_SIZE ? snapshot.docs[PAGE_SIZE - 1].id : null;
    documents = snapshot.docs.slice(0, PAGE_SIZE);
  }

  const auth = getFirebaseAuth();
  const authResult = documents.length ? await auth.getUsers(documents.map((document) => ({ uid: document.id }))) : { users: [] };
  const users = new Map(authResult.users.map((user) => [user.uid, user]));
  const accounts = documents.map((document) => toAdminAccountProfile(document.id, document.data() ?? {}, users.get(document.id)));
  sendJson(response, 200, { accounts, nextCursor });
}

async function searchAccounts(search: string): Promise<AccountDocument[]> {
  const collection = getDatabase().collection('accounts');
  const normalized = search.toLowerCase().slice(0, 128);
  const [handleMatches, emailMatches, directMatch] = await Promise.all([
    collection.orderBy('handle').startAt(normalized).endAt(`${normalized}\uf8ff`).limit(PAGE_SIZE).get(),
    collection.orderBy('email').startAt(normalized).endAt(`${normalized}\uf8ff`).limit(PAGE_SIZE).get(),
    isFirebaseUid(search) ? accountRef(search).get() : Promise.resolve(null)
  ]);
  const matches = new Map<string, AccountDocument>();
  [...handleMatches.docs, ...emailMatches.docs].forEach((document) => matches.set(document.id, document));
  if (directMatch?.exists) matches.set(directMatch.id, directMatch);
  return [...matches.values()].slice(0, PAGE_SIZE);
}

async function updateAccountProfile(update: AdminAccountUpdate, administratorUid: string): Promise<AdminAccountProfile> {
  const database = getDatabase();
  const auditRef = accountRef(update.uid).collection('moderationAudit').doc();
  await database.runTransaction(async (transaction) => {
    const targetRef = accountRef(update.uid);
    const target = await transaction.get(targetRef);
    if (!target.exists) throw new AccountInputError('Account not found.', 'account_not_found');
    const current = target.data() ?? {};
    if (current.status === 'deleting') throw new AccountInputError('An account being deleted cannot be edited.', 'account_deleting');
    const changes: Record<string, unknown> = {};
    const before: Record<string, unknown> = {};

    if (update.handle !== undefined && update.handle !== current.handle) {
      const nextHandleRef = handleRef(update.handle);
      const oldHandleRef = typeof current.handle === 'string' ? handleRef(current.handle) : null;
      const [nextHandle, oldHandle] = await Promise.all([
        transaction.get(nextHandleRef),
        oldHandleRef ? transaction.get(oldHandleRef) : Promise.resolve(null)
      ]);
      if (nextHandle.exists && nextHandle.data()?.uid !== update.uid) {
        throw new AccountInputError('That handle is already taken.', 'handle_taken');
      }
      transaction.set(nextHandleRef, { uid: update.uid, createdAt: Timestamp.now(), moderatedBy: administratorUid }, { merge: true });
      if (oldHandleRef && oldHandle?.data()?.uid === update.uid) transaction.delete(oldHandleRef);
      before.handle = current.handle ?? null;
      changes.handle = update.handle;
      changes.handleChangedAt = Timestamp.now();
    }
    if (update.avatar !== undefined && update.avatar !== current.avatar) {
      before.avatar = current.avatar ?? null;
      changes.avatar = update.avatar;
    }
    if (update.attributionEnabled === false && current.attributionEnabled === true) {
      before.attributionEnabled = true;
      changes.attributionEnabled = false;
    }
    if (!Object.keys(changes).length) throw new AccountInputError('The profile already has those settings.', 'no_profile_changes');

    changes.updatedAt = FieldValue.serverTimestamp();
    changes.profileModeratedAt = FieldValue.serverTimestamp();
    changes.profileModeratedBy = administratorUid;
    transaction.set(targetRef, changes, { merge: true });
    transaction.create(auditRef, {
      action: 'account.profile_updated',
      actorUid: administratorUid,
      targetUid: update.uid,
      reason: update.reason,
      before,
      after: Object.fromEntries(Object.entries(changes).filter(([key]) => key === 'handle' || key === 'avatar' || key === 'attributionEnabled')),
      createdAt: FieldValue.serverTimestamp()
    });
  });

  await updateCreatorAttribution(update.uid);
  return getAdminAccount(update.uid);
}

async function applyAccountAction(uid: string, action: 'revoke-sessions' | 'suspend' | 'restore', reason: string, administratorUid: string): Promise<AdminAccountProfile> {
  const target = await accountRef(uid).get();
  if (!target.exists) throw new AccountInputError('Account not found.', 'account_not_found');
  if (target.data()?.status === 'deleting') throw new AccountInputError('An account being deleted cannot be moderated.', 'account_deleting');
  const auth = getFirebaseAuth();

  if (action === 'suspend') {
    await auth.updateUser(uid, { disabled: true });
    await auth.revokeRefreshTokens(uid);
    await accountRef(uid).set({ status: 'suspended', suspendedAt: FieldValue.serverTimestamp(), suspendedBy: administratorUid }, { merge: true });
  } else if (action === 'restore') {
    await auth.updateUser(uid, { disabled: false });
    await accountRef(uid).set({ status: 'active', suspendedAt: FieldValue.delete(), suspendedBy: FieldValue.delete() }, { merge: true });
  } else {
    await auth.revokeRefreshTokens(uid);
  }

  await accountRef(uid).collection('moderationAudit').add({
    action: `account.${action}`,
    actorUid: administratorUid,
    targetUid: uid,
    reason,
    createdAt: FieldValue.serverTimestamp()
  });
  return getAdminAccount(uid);
}

async function updateCreatorAttribution(uid: string): Promise<void> {
  const [account, datasets] = await Promise.all([
    accountRef(uid).get(),
    getDatabase().collection('datasets').where('creatorUid', '==', uid).limit(250).get()
  ]);
  const data = account.data() ?? {};
  const writer = getDatabase().bulkWriter();
  for (const dataset of datasets.docs) {
    if (data.attributionEnabled === true && typeof data.handle === 'string' && typeof data.avatar === 'string') {
      writer.update(dataset.ref, { attributionEnabled: true, creator: { handle: data.handle, avatar: data.avatar } });
    } else {
      writer.update(dataset.ref, { attributionEnabled: false, creator: FieldValue.delete() });
    }
  }
  await writer.close();
}

async function getAdminAccount(uid: string): Promise<AdminAccountProfile> {
  const [account, user] = await Promise.all([accountRef(uid).get(), getFirebaseAuth().getUser(uid)]);
  if (!account.exists) throw new AccountInputError('Account not found.', 'account_not_found');
  return toAdminAccountProfile(uid, account.data() ?? {}, user);
}

function toAdminAccountProfile(uid: string, data: DocumentData, user?: UserRecord): AdminAccountProfile {
  const status = data.status === 'deleting' ? 'deleting' : data.status === 'suspended' || user?.disabled ? 'suspended' : 'active';
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : user?.email ?? '',
    handle: typeof data.handle === 'string' ? data.handle : '',
    avatar: isAccountAvatar(data.avatar) ? data.avatar : 'quiz-bot',
    attributionEnabled: data.attributionEnabled === true,
    admin: user?.customClaims?.admin === true,
    createdAt: toIso(data.createdAt),
    ...(data.handleChangedAt ? { handleChangedAt: toIso(data.handleChangedAt) } : {}),
    status,
    disabled: user?.disabled ?? status === 'suspended',
    emailVerified: user?.emailVerified ?? false,
    providers: [...new Set(user?.providerData.map((provider) => provider.providerId) ?? [])],
    ...(data.lastActiveAt ? { lastActiveAt: toIso(data.lastActiveAt) } : {}),
    ...(user?.metadata.lastSignInTime ? { lastSignInAt: new Date(user.metadata.lastSignInTime).toISOString() } : {})
  };
}

function toModerationEvent(targetUid: string, id: string, data: DocumentData, actorHandles: Map<string, string>): AdminModerationEvent {
  const actorUid = typeof data.actorUid === 'string' ? data.actorUid : 'unknown';
  const action = isModerationAction(data.action) ? data.action : 'account.profile_updated';
  const before = moderationChanges(data.before);
  const after = moderationChanges(data.after);
  return {
    id,
    action,
    actor: { uid: actorUid, handle: actorHandles.get(actorUid) ?? 'former_admin' },
    targetUid,
    reason: typeof data.reason === 'string' ? data.reason : 'No reason recorded.',
    createdAt: toIso(data.createdAt),
    ...(Object.keys(before).length ? { before } : {}),
    ...(Object.keys(after).length ? { after } : {})
  };
}

function moderationChanges(value: unknown): AdminModerationChanges {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const changes: AdminModerationChanges = {};
  if (typeof source.handle === 'string' || source.handle === null) changes.handle = source.handle;
  if (typeof source.avatar === 'string' || source.avatar === null) changes.avatar = source.avatar;
  if (typeof source.attributionEnabled === 'boolean' || source.attributionEnabled === null) changes.attributionEnabled = source.attributionEnabled;
  return changes;
}

function isModerationAction(value: unknown): value is AdminModerationEvent['action'] {
  return value === 'account.profile_updated' || value === 'account.revoke-sessions' || value === 'account.suspend' || value === 'account.restore';
}

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return (value.toDate() as Date).toISOString();
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date(0).toISOString();
}

function isFirebaseUid(value: string): boolean {
  return /^[a-zA-Z0-9_-]{6,128}$/.test(value);
}

function isDocumentId(value: string): boolean {
  return value.length > 0 && value.length <= 128 && !value.includes('/');
}

type AccountDocument = { id: string; data: () => DocumentData | undefined };
