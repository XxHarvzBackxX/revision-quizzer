import type { VercelRequest, VercelResponse } from '@vercel/node';
import claimHandler from './_claim.js';
import dataHandler from './_data.js';
import deleteHandler from './_delete.js';
import exportHandler from './_export.js';
import meHandler from './_me.js';
import submissionsHandler from './_submissions.js';
import { sendJson } from '../_http.js';

type AccountHandler = (request: VercelRequest, response: VercelResponse) => void | Promise<void>;

const handlers: Record<string, AccountHandler> = {
  claim: claimHandler,
  data: dataHandler,
  delete: deleteHandler,
  export: exportHandler,
  me: meHandler,
  submissions: submissionsHandler
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const action = routeAction(request.query.action);
  const actionHandler = action ? handlers[action] : undefined;
  if (!actionHandler) {
    sendJson(response, 404, { error: 'Account endpoint not found.' });
    return;
  }
  await actionHandler(request, response);
}

function routeAction(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
