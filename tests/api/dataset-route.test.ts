import type { VercelRequest, VercelResponse } from '@vercel/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findCuratedDataset: vi.fn(),
  getDatasetsCollection: vi.fn()
}));

vi.mock('../../api/_curated.js', () => ({
  findCuratedDataset: mocks.findCuratedDataset
}));

vi.mock('../../api/_datasets.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/_datasets.js')>();
  return {
    ...actual,
    getDatasetsCollection: mocks.getDatasetsCollection
  };
});

import handler from '../../api/datasets/[id]';

describe('public dataset detail route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCuratedDataset.mockReturnValue(undefined);
  });

  it('returns approved community datasets', async () => {
    mocks.getDatasetsCollection.mockReturnValue(createCollection('approved'));
    const response = createResponse();

    await handler(createRequest('community-quiz'), response.value);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ dataset: { id: 'community-quiz', status: 'approved' } });
  });

  it('hides pending community datasets', async () => {
    mocks.getDatasetsCollection.mockReturnValue(createCollection('pending'));
    const response = createResponse();

    await handler(createRequest('pending-quiz'), response.value);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Dataset not found.' });
  });
});

function createCollection(status: 'approved' | 'pending') {
  return {
    doc: vi.fn((id: string) => ({
      get: vi.fn(async () => ({
        id,
        exists: true,
        data: () => ({
          slug: id,
          title: 'Community quiz',
          items: [],
          status
        })
      }))
    }))
  };
}

function createRequest(id: string): VercelRequest {
  return { method: 'GET', query: { id } } as VercelRequest;
}

function createResponse() {
  const result: { status?: number; body?: unknown; value: VercelResponse } = {
    value: undefined as unknown as VercelResponse
  };
  const response = {
    setHeader: vi.fn(),
    status: vi.fn((status: number) => {
      result.status = status;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      result.body = body;
      return response;
    })
  };
  result.value = response as unknown as VercelResponse;
  return result;
}
