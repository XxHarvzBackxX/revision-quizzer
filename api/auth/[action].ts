import type { VercelRequest, VercelResponse } from '@vercel/node';
import csrfHandler from './_csrf.js';
import sessionHandler from './_session.js';
import signoutHandler from './_signout.js';
import { sendJson } from '../_http.js';

type AuthHandler = (request: VercelRequest, response: VercelResponse) => void | Promise<void>;

const handlers: Record<string, AuthHandler> = {
  csrf: csrfHandler,
  session: sessionHandler,
  signout: signoutHandler
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const action = routeAction(request.query.action);
  const actionHandler = action ? handlers[action] : undefined;
  if (!actionHandler) {
    sendJson(response, 404, { error: 'Authentication endpoint not found.' });
    return;
  }
  await actionHandler(request, response);
}

function routeAction(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
