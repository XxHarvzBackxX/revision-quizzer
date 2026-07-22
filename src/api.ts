import type {
  AccountDataBundle,
  AccountDomain,
  AccountOnboarding,
  AccountProfile,
  AdminAccountAction,
  AdminAccountProfile,
  AdminAccountUpdate
} from '../shared/account';
import type { AdminConfig, DatasetInput, DatasetSummary, PublicConfig, PublicDataset } from '../shared/quiz';
import { resetCsrfToken, secureRequestHeaders } from './security';

export async function fetchDatasets(): Promise<DatasetSummary[]> {
  const payload = await requestJson<{ datasets: DatasetSummary[] }>('/api/datasets', 'Could not load datasets.');
  return payload.datasets;
}

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const payload = await requestJson<{ config: PublicConfig }>('/api/config', 'Could not load app config.');
  return payload.config;
}

export async function fetchDataset(id: string): Promise<PublicDataset> {
  const payload = await requestJson<{ dataset: PublicDataset }>(
    `/api/datasets/${encodeURIComponent(id)}`,
    'Could not load dataset.'
  );
  return payload.dataset;
}

export async function uploadDataset(
  dataset: DatasetInput
): Promise<PublicDataset> {
  const payload = await requestJson<{ dataset: PublicDataset }>('/api/datasets', 'Could not upload dataset.', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataset)
  });
  return payload.dataset;
}

export async function fetchAdminDatasets(): Promise<PublicDataset[]> {
  const payload = await requestJson<{ datasets: PublicDataset[] }>(
    '/api/admin/datasets',
    'Could not load admin datasets.',
    undefined
  );
  return payload.datasets;
}

export async function updateAdminDataset(
  id: string,
  dataset: DatasetInput,
  status: 'approved' | 'pending'
): Promise<void> {
  await requestJson(
    `/api/admin/datasets/${encodeURIComponent(id)}`,
    'Could not update dataset.',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset, status })
    }
  );
}

export async function deleteAdminDataset(id: string): Promise<void> {
  await requestJson(`/api/admin/datasets/${encodeURIComponent(id)}`, 'Could not delete dataset.', {
    method: 'DELETE'
  });
}

export async function fetchAdminConfig(): Promise<AdminConfig> {
  const payload = await requestJson<{ config: AdminConfig }>('/api/admin/config', 'Could not load admin config.');
  return payload.config;
}

export async function updateAdminConfig(config: AdminConfig): Promise<AdminConfig> {
  const payload = await requestJson<{ config: AdminConfig }>('/api/admin/config', 'Could not update admin config.', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });
  return payload.config;
}

export async function fetchAdminAccounts(query = '', cursor = ''): Promise<{ accounts: AdminAccountProfile[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (cursor) params.set('cursor', cursor);
  const suffix = params.size ? `?${params.toString()}` : '';
  return requestJson(`/api/admin/accounts${suffix}`, 'Could not load account profiles.');
}

export async function updateAdminAccount(update: AdminAccountUpdate): Promise<AdminAccountProfile> {
  const payload = await requestJson<{ account: AdminAccountProfile }>('/api/admin/accounts', 'Could not update that account.', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  return payload.account;
}

export async function applyAdminAccountAction(action: AdminAccountAction): Promise<AdminAccountProfile> {
  const payload = await requestJson<{ account: AdminAccountProfile }>('/api/admin/accounts', 'Could not complete that account action.', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  });
  return payload.account;
}

export async function createSession(idToken: string, onboarding?: AccountOnboarding): Promise<AccountProfile> {
  const payload = await requestJson<{ account: AccountProfile }>('/api/auth/session', 'Could not create your secure session.', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, ...(onboarding ? { onboarding } : {}) })
  });
  return payload.account;
}

export async function signOutSession(): Promise<void> {
  await requestJson('/api/auth/signout', 'Could not sign out securely.', { method: 'POST' });
}

export async function fetchAccount(): Promise<AccountProfile | null> {
  const response = await fetch('/api/account/me', { credentials: 'same-origin' });
  if (response.status === 401) return null;
  const payload = await response.json() as { account?: AccountProfile; error?: string };
  if (!response.ok || !payload.account) throw new Error(payload.error || 'Could not load your account.');
  return payload.account;
}

export async function fetchAccountData(): Promise<AccountDataBundle> {
  const payload = await requestJson<{ domains: AccountDataBundle }>('/api/account/data', 'Could not load account progress.');
  return payload.domains;
}

export async function syncAccountDomain(domain: AccountDomain, data: Record<string, unknown>, revision: number): Promise<number> {
  const payload = await requestJson<{ revision: number }>('/api/account/data', 'Could not sync account progress.', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, data, revision })
  });
  return payload.revision;
}

export async function claimLegacyProgress(claimId: string, domains: Record<string, Record<string, unknown>>): Promise<void> {
  await requestJson('/api/account/claim', 'Could not claim browser progress.', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimId, domains })
  });
}

export async function updateAccountProfile(changes: Partial<Pick<AccountProfile, 'handle' | 'avatar' | 'attributionEnabled'>>, idToken?: string): Promise<AccountProfile> {
  const payload = await requestJson<{ account: AccountProfile }>('/api/account/me', 'Could not update your profile.', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(idToken ? { 'X-Firebase-ID-Token': idToken } : {}) },
    body: JSON.stringify(changes)
  });
  return payload.account;
}

export async function deleteAccount(approvedContent: 'anonymize' | 'delete', idToken: string): Promise<void> {
  await requestJson('/api/account/delete', 'Could not delete your account.', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'X-Firebase-ID-Token': idToken },
    body: JSON.stringify({ approvedContent })
  });
}

export async function fetchOwnedSubmissions(): Promise<DatasetSummary[]> {
  const payload = await requestJson<{ datasets: DatasetSummary[] }>('/api/account/submissions', 'Could not load your submissions.');
  return payload.datasets;
}

export async function deleteOwnedSubmission(id: string): Promise<void> {
  await requestJson('/api/account/submissions', 'Could not delete the submission.', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

async function requestJson<T = unknown>(
  url: string,
  fallbackMessage: string,
  options?: RequestInit
): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET';
  const protectedHeaders = method === 'GET' || method === 'HEAD' ? {} : await secureRequestHeaders();
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { ...options?.headers, ...protectedHeaders }
  });
  const payload: unknown = await response.json();

  if (response.status === 403 && getErrorCode(payload) === 'invalid_csrf' && method !== 'GET' && method !== 'HEAD') {
    resetCsrfToken();
    const retryHeaders = await secureRequestHeaders();
    const retry = await fetch(url, { ...options, credentials: 'same-origin', headers: { ...options?.headers, ...retryHeaders } });
    const retryPayload: unknown = await retry.json();
    if (!retry.ok) throw new ApiError(getErrorMessage(retryPayload, fallbackMessage), getErrorCode(retryPayload), retry.status);
    return retryPayload as T;
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, fallbackMessage), getErrorCode(payload), response.status);
  }

  return payload as T;
}

export class ApiError extends Error {
  constructor(message: string, readonly code?: string, readonly status?: number) {
    super(message);
  }
}

function getErrorCode(payload: unknown): string | undefined {
  return typeof payload === 'object' && payload !== null && 'code' in payload && typeof payload.code === 'string'
    ? payload.code
    : undefined;
}

function getErrorMessage(payload: unknown, fallbackMessage: string): string {
  if (typeof payload !== 'object' || payload === null) {
    return fallbackMessage;
  }

  if ('errors' in payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.map(String).join('\n');
  }

  if ('error' in payload && typeof payload.error === 'string' && payload.error) {
    return payload.error;
  }

  return fallbackMessage;
}
