import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type FirebaseCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export function getDatabase() {
  if (getApps().length === 0) {
    const credentials = getFirebaseCredentials();

    initializeApp({
      credential: cert(credentials)
    });
  }

  return getFirestore();
}

function getFirebaseCredentials(): FirebaseCredentials {
  const fromBase64 = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, true);
  if (fromBase64) {
    return fromBase64;
  }

  const fromJson = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, false);
  if (fromJson) {
    return fromJson;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase admin credentials are not configured.');
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

function parseServiceAccountJson(value: string | undefined, isBase64: boolean): FirebaseCredentials | null {
  if (!value?.trim()) {
    return null;
  }

  const raw = isBase64 ? Buffer.from(value.trim(), 'base64').toString('utf8') : value.trim();
  const parsed = JSON.parse(raw) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('Firebase service account JSON is missing project_id, client_email, or private_key.');
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: normalizePrivateKey(parsed.private_key) ?? parsed.private_key
  };
}

function normalizePrivateKey(value: string | undefined): string | undefined {
  return value
    ?.trim()
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
}
