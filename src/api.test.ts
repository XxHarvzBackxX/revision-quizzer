import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatasetInput } from '../shared/quiz';
import {
  deleteAccount,
  fetchDataset,
  fetchDatasets,
  updateAdminDataset,
  uploadDataset
} from './api';

vi.mock('./security', () => ({ secureRequestHeaders: vi.fn(async () => ({ 'X-CSRF-Token': 'csrf-test' })) }));

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
    expect(fetch).toHaveBeenCalledWith('/api/datasets', { credentials: 'same-origin', headers: {} });
  });

  it('URL-encodes dataset identifiers', async () => {
    mockFetch({ dataset: { id: 'quiz/one' } });

    await fetchDataset('quiz/one');

    expect(fetch).toHaveBeenCalledWith('/api/datasets/quiz%2Fone', { credentials: 'same-origin', headers: {} });
  });

  it('sends the JSON dataset with the request security token', async () => {
    mockFetch({ dataset: { id: 'quiz-1' } });

    await uploadDataset(dataset);

    expect(fetch).toHaveBeenCalledWith('/api/datasets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf-test'
      },
      credentials: 'same-origin',
      body: JSON.stringify(dataset)
    });
  });

  it('joins server validation errors into one actionable message', async () => {
    mockFetch({ errors: ['Title is required.', 'At least one item is required.'] }, false);

    await expect(uploadDataset(dataset)).rejects.toThrow(
      'Title is required.\nAt least one item is required.'
    );
  });

  it('sends admin dataset updates through the authenticated route', async () => {
    mockFetch({ ok: true });

    await updateAdminDataset('quiz/one', dataset, 'pending');

    expect(fetch).toHaveBeenCalledWith('/api/admin/datasets/quiz%2Fone', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf-test'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ dataset, status: 'pending' })
    });
  });

  it('routes account deletion through the consolidated account function', async () => {
    mockFetch({ ok: true });

    await deleteAccount('anonymize', 'fresh-id-token');

    expect(fetch).toHaveBeenCalledWith('/api/account/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-ID-Token': 'fresh-id-token',
        'X-CSRF-Token': 'csrf-test'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ approvedContent: 'anonymize' })
    });
  });
});

function mockFetch(payload: unknown, ok = true): void {
  vi.mocked(fetch).mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(payload)
  } as unknown as Response);
}
