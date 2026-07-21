import type { AdminConfig } from '../shared/quiz.js';
import { getDatabase } from './_firebase.js';

const CONFIG_COLLECTION = 'config';
const CONFIG_DOCUMENT = 'app';

export async function getAppConfig(): Promise<AdminConfig> {
  const document = await getConfigDocument().get();
  const data = document.data() ?? {};

  return {
    moderationEnabled: Boolean(data.moderationEnabled),
    uploadKey: String(data.uploadKey ?? process.env.UPLOAD_KEY ?? '').trim()
  };
}

export async function saveAppConfig(config: AdminConfig): Promise<void> {
  await getConfigDocument().set(config, { merge: true });
}

function getConfigDocument() {
  return getDatabase().collection(CONFIG_COLLECTION).doc(CONFIG_DOCUMENT);
}
