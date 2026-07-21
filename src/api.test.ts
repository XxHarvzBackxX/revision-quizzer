import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatasetInput } from '../shared/quiz';
import {
  fetchDataset,
  fetchDatasets,
  loginAdmin,
  updateAdminDataset,
  uploadDataset
} from './api';

const dataset: DatasetInput = {
  title: 'Cloud basics',
  items: [{ type: 'flashcard', prompt: 'What is IaaS?', answer: 'Infrastructure as a service' }]
};

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads dataset summaries from the public endpoint', async () => {
    const datasets = [{ id: 'quiz-1', slug: 'quiz-1', title: 'Quiz 1' }];
    mockFetch({ datasets });

    await expect(fetchDatasets()).resolves.toEqual(datasets);
    expect(fetch).toHaveBeenCalledWith('/api/datasets', undefined);
  });

  it('URL-encodes dataset identifiers', async () => {
    mockFetch({ dataset: { id: 'quiz/one' } });

    await fetchDataset('quiz/one');

    expect(fetch).toHaveBeenCalledWith('/api/datasets/quiz%2Fone', undefined);
  });

  it('sends upload credentials and the JSON dataset', async () => {
    mockFetch({ dataset: { id: 'quiz-1' } });

    await uploadDataset(dataset, { uploadKey: 'upload-secret' });

    expect(fetch).toHaveBeenCalledWith('/api/datasets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-upload-key': 'upload-secret'
      },
      body: JSON.stringify(dataset)
    });
  });

  it('joins server validation errors into one actionable message', async () => {
    mockFetch({ errors: ['Title is required.', 'At least one item is required.'] }, false);

    await expect(uploadDataset(dataset, {})).rejects.toThrow(
      'Title is required.\nAt least one item is required.'
    );
  });

  it('uses the operation fallback when an error response has no message', async () => {
    mockFetch({}, false);

    await expect(loginAdmin('secret')).rejects.toThrow('Could not log in.');
  });

  it('sends admin dataset updates through the authenticated route', async () => {
    mockFetch({ ok: true });

    await updateAdminDataset('quiz/one', dataset, 'pending', 'admin-secret');

    expect(fetch).toHaveBeenCalledWith('/api/admin/datasets/quiz%2Fone', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': 'admin-secret'
      },
      body: JSON.stringify({ dataset, status: 'pending' })
    });
  });
});

function mockFetch(payload: unknown, ok = true): void {
  vi.mocked(fetch).mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(payload)
  } as unknown as Response);
}
