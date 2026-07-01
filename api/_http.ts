import type { VercelRequest, VercelResponse } from '@vercel/node';

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.setHeader('Content-Type', 'application/json');
  response.status(status).json(body);
}

export function getUploadKey(request: VercelRequest): string {
  const header = request.headers['x-upload-key'];
  if (Array.isArray(header)) {
    return header[0] ?? '';
  }

  return header ?? '';
}

export function getAdminPassword(request: VercelRequest): string {
  const header = request.headers['x-admin-password'];
  if (Array.isArray(header)) {
    return header[0] ?? '';
  }

  return header ?? '';
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
