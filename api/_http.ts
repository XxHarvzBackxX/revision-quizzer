import type { VercelRequest, VercelResponse } from '@vercel/node';

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.setHeader('Content-Type', 'application/json');
  response.status(status).json(body);
}

export function sendMethodNotAllowed(response: VercelResponse, methods: readonly string[]): void {
  response.setHeader('Allow', methods.join(', '));
  sendJson(response, 405, { error: 'Method not allowed.' });
}

export function sendServerError(response: VercelResponse, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  sendJson(response, 500, { error: message });
}

export function getUploadKey(request: VercelRequest): string {
  return getHeader(request, 'x-upload-key');
}

export function getAdminPassword(request: VercelRequest): string {
  return getHeader(request, 'x-admin-password');
}

export function getQueryParam(request: VercelRequest, name: string): string {
  const value = request.query[name];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function getHeader(request: VercelRequest, name: string): string {
  const header = request.headers[name];
  return Array.isArray(header) ? header[0] ?? '' : header ?? '';
}

export async function readJsonBody(request: VercelRequest): Promise<unknown> {
  if (typeof request.body === 'object' && request.body !== null) {
    return request.body;
  }

  if (typeof request.body === 'string') {
    return JSON.parse(request.body);
  }

  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8');
      if (body.length > 512_000) {
        reject(new Error('Request body is too large.'));
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}
