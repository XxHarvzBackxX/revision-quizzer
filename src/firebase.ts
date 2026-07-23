import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import { getAuth, inMemoryPersistence, setPersistence, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let authPromise: Promise<Auth> | null = null;
let appCheck: AppCheck | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_APP_ID);
}

export async function getFirebaseAuthClient(): Promise<Auth> {
  if (!isFirebaseConfigured()) throw new Error('Account sign-in is not configured on this deployment.');
  if (!authPromise) {
    const auth = getAuth(getFirebaseApp());
    authPromise = setPersistence(auth, inMemoryPersistence).then(() => auth);
  }
  return authPromise;
}

export async function getAppCheckHeader(): Promise<Record<string, string>> {
  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey || !isFirebaseConfigured()) return {};
  try {
    if (!appCheck) {
      appCheck = initializeAppCheck(getFirebaseApp(), {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
    const token = await getToken(appCheck, false);
    return { 'X-Firebase-AppCheck': token.token };
  } catch {
    return {};
  }
}

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    });
  }
  return app;
}
