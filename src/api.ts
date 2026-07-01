import type { DatasetInput, DatasetSummary, PublicDataset } from '../shared/quiz';

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

export async function uploadDataset(dataset: DatasetInput, uploadKey: string): Promise<PublicDataset> {
  const response = await fetch('/api/datasets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-upload-key': uploadKey
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
