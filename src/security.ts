import { getAppCheckHeader } from './firebase';

let csrfToken = '';

export async function secureRequestHeaders(): Promise<Record<string, string>> {
  if (!csrfToken) {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    const payload = await response.json() as { csrfToken?: string };
    if (!response.ok || !payload.csrfToken) throw new Error('Could not establish a secure connection. Refresh and try again.');
    csrfToken = payload.csrfToken;
  }
  return {
    'X-CSRF-Token': csrfToken,
    ...await getAppCheckHeader()
  };
}

export function resetCsrfToken(): void {
  csrfToken = '';
}
