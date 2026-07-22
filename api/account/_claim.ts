import { Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ACCOUNT_DOMAINS } from '../../shared/account.js';
import { accountDataRef, accountRef, hasClaimId, nextClaimIds, normalizeClaimId, validateDomainPayload } from '../_account.js';
import { requireProtectedRequest, requireUser } from '../_auth.js';
import { getDatabase } from '../_firebase.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    sendMethodNotAllowed(response, ['POST']);
    return;
  }
  if (!await requireProtectedRequest(request, response)) return;
  const user = await requireUser(request, response);
  if (!user) return;
  try {
    const body = await readJsonBody(request);
    if (!isRecord(body) || !isRecord(body.domains)) {
      sendJson(response, 400, { error: 'The legacy progress bundle is invalid.' });
      return;
    }
    const domains = body.domains;
    const claimId = normalizeClaimId(body.claimId);
    if (!claimId) {
      sendJson(response, 400, { error: 'The claim identifier is invalid.' });
      return;
    }
    const validated = ACCOUNT_DOMAINS.flatMap((domain) => {
      const value = domains[domain];
      if (value === undefined) return [];
      const payload = validateDomainPayload(domain, value);
      return payload ? [payload] : [];
    });
    if (validated.length !== Object.keys(domains).length) {
      sendJson(response, 400, { error: 'One or more legacy progress sections are invalid or too large.' });
      return;
    }
    const database = getDatabase();
    const imported = await database.runTransaction(async (transaction) => {
      const account = await transaction.get(accountRef(user.uid));
      const accountData = account.data() ?? {};
      if (hasClaimId(accountData, claimId)) return false;
      const existing = await Promise.all(validated.map((payload) => transaction.get(accountDataRef(user.uid, payload.domain))));
      validated.forEach((payload, index) => {
        const current = existing[index].data() ?? {};
        const revision = typeof current.revision === 'number' ? current.revision : 0;
        transaction.set(accountDataRef(user.uid, payload.domain), {
          data: mergeRecords(isRecord(current.data) ? current.data : {}, payload.data),
          revision: revision + 1,
          updatedAt: Timestamp.now()
        });
      });
      transaction.set(accountRef(user.uid), { claimIds: nextClaimIds(accountData, claimId) }, { merge: true });
      return true;
    });
    sendJson(response, 200, { ok: true, imported });
  } catch (error) {
    sendServerError(response, error);
  }
}

function mergeRecords(current: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  return mergeValues(current, incoming) as Record<string, unknown>;
}

function mergeValues(current: unknown, incoming: unknown): unknown {
  if (current === undefined) return incoming;
  if (incoming === undefined) return current;
  if (Array.isArray(current) && Array.isArray(incoming)) {
    const keyed = [...current, ...incoming].every((entry) => isRecord(entry) && (typeof entry.id === 'string' || typeof entry.datasetId === 'string'));
    if (keyed) {
      const byId = new Map<string, unknown>();
      for (const entry of [...current, ...incoming]) {
        const record = entry as Record<string, unknown>;
        const id = String(record.id ?? record.datasetId);
        if (!byId.has(id)) byId.set(id, entry);
      }
      return Array.from(byId.values());
    }
    return Array.from(new Set([...current, ...incoming].map((entry) => JSON.stringify(entry)))).map((entry) => JSON.parse(entry) as unknown);
  }
  if (isRecord(current) && isRecord(incoming)) {
    return Object.fromEntries(Array.from(new Set([...Object.keys(current), ...Object.keys(incoming)])).map((key) => [key, mergeValues(current[key], incoming[key])]));
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
