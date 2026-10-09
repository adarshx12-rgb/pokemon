import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithRetry } from './http';

const respond = (status: number) => new Response('{}', { status });

afterEach(() => vi.unstubAllGlobals());

describe('fetchWithRetry', () => {
  it('retries 5xx responses and returns the first success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(respond(500))
      .mockResolvedValueOnce(respond(502))
      .mockResolvedValueOnce(respond(200));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchWithRetry('https://x.test', {}, { retries: 3, delayMs: 0 });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry 4xx responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(404));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchWithRetry('https://x.test', {}, { retries: 3, delayMs: 0 });
    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries network errors and returns the last 5xx when retries run out', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue(respond(503));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchWithRetry('https://x.test', {}, { retries: 2, delayMs: 0 });
    expect(res.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rethrows a network error on the final attempt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(fetchWithRetry('https://x.test', {}, { retries: 1, delayMs: 0 })).rejects.toThrow('fetch failed');
  });
});
