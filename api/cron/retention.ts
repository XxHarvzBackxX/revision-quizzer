import { Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { accountRef, deleteAccount } from '../_account.js';
import { getDatabase, getFirebaseAuth } from '../_firebase.js';
import { getHeader, sendJson, sendMethodNotAllowed, sendServerError } from '../_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET']);
    return;
  }
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || getHeader(request, 'authorization') !== `Bearer ${cronSecret}`) {
    sendJson(response, 401, { error: 'Cron authorization is required.' });
    return;
  }

  try {
    const now = new Date();
    const deleteCutoff = new Date(now);
    deleteCutoff.setUTCFullYear(deleteCutoff.getUTCFullYear() - 2);
    const warningCutoff = new Date(deleteCutoff.getTime() + 30 * 24 * 60 * 60 * 1000);
    const accounts = await getDatabase().collection('accounts')
      .where('lastActiveAt', '<=', Timestamp.fromDate(warningCutoff))
      .limit(100)
      .get();
    let warned = 0;
    let deleted = 0;
    let failed = 0;

    const unfinished = await getDatabase().collection('accounts').where('status', '==', 'deleting').limit(25).get();
    for (const document of unfinished.docs) {
      try {
        await deleteAccount(document.id, document.data().deletionApprovedContent === 'delete' ? 'delete' : 'anonymize');
        deleted += 1;
      } catch (error) {
        failed += 1;
        console.error('Deletion retry failed', { uid: document.id, error });
      }
    }

    for (const document of accounts.docs) {
      try {
        const data = document.data();
        const lastActive = data.lastActiveAt?.toDate?.() as Date | undefined;
        if (!lastActive) continue;
        const warningSentAt = data.inactivityWarningSentAt?.toDate?.() as Date | undefined;
        const action = retentionAction(now, lastActive, warningSentAt);
        if (action === 'delete') {
          await deleteAccount(document.id, 'anonymize');
          deleted += 1;
          continue;
        }
        if (action === 'warn') {
          const user = await getFirebaseAuth().getUser(document.id);
          if (user.email) {
            await sendRetentionWarning(user.email, typeof data.handle === 'string' ? data.handle : 'player');
            await accountRef(document.id).set({ inactivityWarningSentAt: Timestamp.now() }, { merge: true });
            warned += 1;
          }
        }
      } catch (error) {
        failed += 1;
        console.error('Retention action failed', { uid: document.id, error });
      }
    }

    sendJson(response, 200, { ok: true, inspected: accounts.size + unfinished.size, warned, deleted, failed });
  } catch (error) {
    sendServerError(response, error);
  }
}

export function retentionAction(now: Date, lastActive: Date, warningSentAt?: Date): 'none' | 'warn' | 'delete' {
  const deleteCutoff = new Date(now);
  deleteCutoff.setUTCFullYear(deleteCutoff.getUTCFullYear() - 2);
  const warningCutoff = new Date(deleteCutoff.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (lastActive > warningCutoff) return 'none';

  const warningCoversCurrentInactivity = Boolean(warningSentAt && warningSentAt > lastActive);
  if (!warningCoversCurrentInactivity) return 'warn';

  const warningMaturesAt = new Date(warningSentAt!.getTime() + 30 * 24 * 60 * 60 * 1000);
  return lastActive <= deleteCutoff && warningMaturesAt <= now ? 'delete' : 'none';
}

async function sendRetentionWarning(email: string, handle: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RETENTION_FROM_EMAIL;
  const origin = process.env.APP_ORIGIN;
  if (!apiKey || !from || !origin) throw new Error('Retention email is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your Quiz Arcade account is scheduled for deletion',
      text: `Hi ${handle},\n\nYour Quiz Arcade account has been inactive for nearly two years. Sign in within 30 days to keep it and cancel deletion: ${origin}/login\n\nIf you take no action, your account and learning progress will be deleted. Approved community sets will remain without your identity.\n\nHarvey Wells\nQuiz Arcade`
    })
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}.`);
}
