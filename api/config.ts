import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PublicConfig } from '../shared/quiz.js';
import { getAppConfig } from './_config.js';
import { sendJson, sendMethodNotAllowed, sendServerError } from './_http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET']);
    return;
  }

  try {
    const appConfig = await getAppConfig();
    const config: PublicConfig = { uploadKeyRequired: appConfig.uploadKey.length > 0 };
    sendJson(response, 200, { config });
  } catch (error) {
    sendServerError(response, error);
  }
}
