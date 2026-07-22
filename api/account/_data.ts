import { Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { accountDataRef, getAccountData, validateDomainPayload } from '../_account.js';
import { requireProtectedRequest, requireUser } from '../_auth.js';
import { getDatabase } from '../_firebase.js';
import { readJsonBody, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const user = await requireUser(request, response);
    if (!user) return;
    if (request.method === 'GET') {
      sendJson(response, 200, { domains: await getAccountData(user.uid) });
      return;
    }
    if (request.method === 'PUT') {
      if (!await requireProtectedRequest(request, response)) return;
      const body = await readJsonBody(request);
      if (!isRecord(body)) {
        sendJson(response, 400, { error: 'Sync data must be a JSON object.' });
        return;
      }
      const payload = validateDomainPayload(body.domain, body.data);
      const expectedRevision = Number.isInteger(body.revision) && Number(body.revision) >= 0 ? Number(body.revision) : -1;
      if (!payload || expectedRevision < 0) {
        sendJson(response, 400, { error: 'The sync payload is invalid or too large.' });
        return;
      }
      const ref = accountDataRef(user.uid, payload.domain);
      const result = await getDatabase().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.data() ?? {};
        const revision = typeof current.revision === 'number' ? current.revision : 0;
        if (revision !== expectedRevision) return { conflict: true as const, revision, data: isRecord(current.data) ? current.data : {} };
        transaction.set(ref, { data: payload.data, revision: revision + 1, updatedAt: Timestamp.now() });
        return { conflict: false as const, revision: revision + 1 };
      });
      if (result.conflict) {
        sendJson(response, 409, { error: 'This data changed on another device.', code: 'sync_conflict', domain: payload.domain, revision: result.revision, data: result.data });
        return;
      }
      sendJson(response, 200, { domain: payload.domain, revision: result.revision });
      return;
    }
    sendMethodNotAllowed(response, ['GET', 'PUT']);
  } catch (error) {
    sendServerError(response, error);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
