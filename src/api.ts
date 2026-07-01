import type { AdminConfig, DatasetInput, DatasetSummary, PublicDataset } from '../shared/quiz';

export async function fetchDatasets(): Promise<DatasetSummary[]> {
  const response = await fetch('/api/datasets');
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load datasets.');
  }

  return payload.datasets;
}

export async function fetchDataset(id: string): Promise<PublicDataset> {
  const response = await fetch(`/api/datasets/${encodeURIComponent(id)}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load dataset.');
  }

  return payload.dataset;
}

export async function uploadDataset(
  dataset: DatasetInput,
  credential: { uploadKey?: string; adminPassword?: string }
): Promise<PublicDataset> {
  const response = await fetch('/api/datasets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(credential.uploadKey ? { 'x-upload-key': credential.uploadKey } : {}),
      ...(credential.adminPassword ? { 'x-admin-password': credential.adminPassword } : {})
    },
    body: JSON.stringify(dataset)
  });

  const payload = await response.json();

  if (!response.ok) {
    const errors = Array.isArray(payload.errors) ? payload.errors.join('\n') : payload.error;
    throw new Error(errors ?? 'Could not upload dataset.');
  }

  return payload.dataset;
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not log in.');
  }
}

export async function fetchAdminDatasets(adminPassword: string): Promise<PublicDataset[]> {
  const response = await fetch('/api/admin/datasets', {
    headers: {
      'x-admin-password': adminPassword
    }
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load admin datasets.');
  }

  return payload.datasets;
}

export async function updateAdminDataset(
  id: string,
  dataset: DatasetInput,
  status: 'approved' | 'pending',
  adminPassword: string
): Promise<void> {
  const response = await fetch(`/api/admin/datasets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
    body: JSON.stringify({ dataset, status })
  });
  const payload = await response.json();

  if (!response.ok) {
    const errors = Array.isArray(payload.errors) ? payload.errors.join('\n') : payload.error;
    throw new Error(errors ?? 'Could not update dataset.');
  }
}

export async function deleteAdminDataset(id: string, adminPassword: string): Promise<void> {
  const response = await fetch(`/api/admin/datasets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'x-admin-password': adminPassword
    }
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not delete dataset.');
  }
}

export async function fetchAdminConfig(adminPassword: string): Promise<AdminConfig> {
  const response = await fetch('/api/admin/config', {
    headers: {
      'x-admin-password': adminPassword
    }
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load admin config.');
  }

  return payload.config;
}

export async function updateAdminConfig(config: AdminConfig, adminPassword: string): Promise<AdminConfig> {
  const response = await fetch('/api/admin/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
    body: JSON.stringify(config)
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not update admin config.');
  }

  return payload.config;
}
