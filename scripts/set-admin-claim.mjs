import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];
if (!uid || !/^[A-Za-z0-9:_-]{8,128}$/.test(uid)) {
  console.error('Usage: npm run admin:grant -- <exact-firebase-uid>');
  process.exitCode = 1;
} else {
  const credentials = readCredentials();
  const app = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
  const auth = getAuth(app);
  const user = await auth.getUser(uid);
  if (!user.emailVerified) throw new Error('The administrator account must have a verified email address.');
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), admin: true });
  await auth.revokeRefreshTokens(uid);
  console.log(`Administrator claim granted to Firebase UID ${uid}. Existing sessions were revoked.`);
}

function readCredentials() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  const rawJson = base64 ? Buffer.from(base64.trim(), 'base64').toString('utf8') : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) return JSON.parse(rawJson);
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin credentials are not configured.');
  return { projectId, clientEmail, privateKey };
}
