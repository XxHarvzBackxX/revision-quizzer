import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_BODY_BYTES = 512_000;

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.status(status).json(body);
}

export function sendMethodNotAllowed(response: VercelResponse, methods: readonly string[]): void {
  response.setHeader('Allow', methods.join(', '));
  sendJson(response, 405, { error: 'Method not allowed.' });
}

export function sendServerError(response: VercelResponse, error: unknown): void {
  if (error instanceof RequestBodyError) {
    sendJson(response, error.status, { error: error.message });
    return;
  }
  console.error('Unhandled API error', error);
  sendJson(response, 500, { error: 'The request could not be completed.' });
}

export function getQueryParam(request: VercelRequest, name: string): string {
  const value = request.query[name];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function getHeader(request: VercelRequest, name: string): string {
  const header = request.headers[name];
  return Array.isArray(header) ? header[0] ?? '' : header ?? '';
}

export async function readJsonBody(request: VercelRequest): Promise<unknown> {
  if (typeof request.body === 'object' && request.body !== null) {
    if (Buffer.byteLength(JSON.stringify(request.body), 'utf8') > MAX_BODY_BYTES) {
      throw new RequestBodyError(413, 'Request body is too large.');
    }
    return request.body;
  }

  if (typeof request.body === 'string') {
    if (Buffer.byteLength(request.body, 'utf8') > MAX_BODY_BYTES) {
      throw new RequestBodyError(413, 'Request body is too large.');
    }
    try {
      return JSON.parse(request.body);
    } catch {
      throw new RequestBodyError(400, 'Request body must be valid JSON.');
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8');
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        reject(new RequestBodyError(413, 'Request body is too large.'));
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new RequestBodyError(400, 'Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

class RequestBodyError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}
