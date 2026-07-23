import { describe, expect, it, vi } from 'vitest';
import { readJsonBody, sendServerError } from '../../api/_http';

describe('API request boundaries', () => {
  it('rejects oversized bodies even when Vercel has already parsed the JSON', async () => {
    const request = { body: { value: 'x'.repeat(513_000) } };
    await expect(readJsonBody(request as never)).rejects.toThrow('Request body is too large.');
  });

  it('does not expose internal exception messages to clients', () => {
    const json = vi.fn();
    const response = { setHeader: vi.fn(), status: vi.fn(() => ({ json })) };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    sendServerError(response as never, new Error('private credential detail'));

    expect(json).toHaveBeenCalledWith({ error: 'The request could not be completed.' });
    consoleError.mockRestore();
  });
});
