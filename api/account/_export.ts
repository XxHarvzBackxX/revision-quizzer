import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PRIVACY_VERSION } from '../../shared/account.js';
import { accountRef, getAccountData, toAccountProfile } from '../_account.js';
import { requireUser } from '../_auth.js';
import { getDatabase } from '../_firebase.js';
import { sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET']);
    return;
  }
  const user = await requireUser(request, response);
  if (!user) return;
  try {
    const [account, domains, datasets] = await Promise.all([
      accountRef(user.uid).get(),
      getAccountData(user.uid),
      getDatabase().collection('datasets').where('creatorUid', '==', user.uid).limit(250).get()
    ]);
    response.setHeader('Content-Disposition', 'attachment; filename="quiz-arcade-account-export.json"');
    sendJson(response, 200, {
      format: 'quiz-arcade-account-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      privacyVersion: PRIVACY_VERSION,
      account: toAccountProfile(user.uid, account.data() ?? {}, user.admin),
      domains,
      submissions: datasets.docs.map((document) => ({ id: document.id, ...document.data(), creatorUid: undefined }))
    });
  } catch (error) {
    sendServerError(response, error);
  }
}
