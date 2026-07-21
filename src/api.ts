import type { AdminConfig, DatasetInput, DatasetSummary, PublicConfig, PublicDataset } from '../shared/quiz';

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
  dataset: DatasetInput,
  credential: { uploadKey?: string; adminPassword?: string }
): Promise<PublicDataset> {
  const payload = await requestJson<{ dataset: PublicDataset }>('/api/datasets', 'Could not upload dataset.', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(credential.uploadKey ? { 'x-upload-key': credential.uploadKey } : {}),
      ...(credential.adminPassword ? { 'x-admin-password': credential.adminPassword } : {})
    },
    body: JSON.stringify(dataset)
  });
  return payload.dataset;
}

export async function loginAdmin(password: string): Promise<void> {
  await requestJson('/api/admin/login', 'Could not log in.', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });
}

export async function fetchAdminDatasets(adminPassword: string): Promise<PublicDataset[]> {
  const payload = await requestJson<{ datasets: PublicDataset[] }>(
    '/api/admin/datasets',
    'Could not load admin datasets.',
    {
      headers: {
        'x-admin-password': adminPassword
      }
    }
  );
  return payload.datasets;
}

export async function updateAdminDataset(
  id: string,
  dataset: DatasetInput,
  status: 'approved' | 'pending',
  adminPassword: string
): Promise<void> {
  await requestJson(
    `/api/admin/datasets/${encodeURIComponent(id)}`,
    'Could not update dataset.',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({ dataset, status })
    }
  );
}

export async function deleteAdminDataset(id: string, adminPassword: string): Promise<void> {
  await requestJson(`/api/admin/datasets/${encodeURIComponent(id)}`, 'Could not delete dataset.', {
    method: 'DELETE',
    headers: {
      'x-admin-password': adminPassword
    }
  });
}

export async function fetchAdminConfig(adminPassword: string): Promise<AdminConfig> {
  const payload = await requestJson<{ config: AdminConfig }>('/api/admin/config', 'Could not load admin config.', {
    headers: {
      'x-admin-password': adminPassword
    }
  });
  return payload.config;
}

export async function updateAdminConfig(config: AdminConfig, adminPassword: string): Promise<AdminConfig> {
  const payload = await requestJson<{ config: AdminConfig }>('/api/admin/config', 'Could not update admin config.', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
    body: JSON.stringify(config)
  });
  return payload.config;
}

async function requestJson<T = unknown>(
  url: string,
  fallbackMessage: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackMessage));
  }

  return payload as T;
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
