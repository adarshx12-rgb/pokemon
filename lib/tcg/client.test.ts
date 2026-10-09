import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RawCard } from './types';

const raw = (id: string, name: string): RawCard => ({
  id, name, number: '4', rarity: 'Rare Holo',
  set: { name: 'Base', series: 'Base', releaseDate: '1999/01/09' },
  images: { small: 's.png', large: 'l.png' },
  tcgplayer: { updatedAt: '2026/10/01', prices: { holofoil: { market: 400 } } },
});

const fetchWithRetry = vi.fn();
vi.mock('@/lib/http', () => ({ fetchWithRetry: (...args: unknown[]) => fetchWithRetry(...args) }));
vi.mock('./snapshot', () => ({ SNAPSHOT: [raw('base1-4', 'Snapshot Charizard')] }));

const { getCard, getCards } = await import('./client');

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  fetchWithRetry.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('getCards', () => {
  it('returns live cards when the API responds', async () => {
    fetchWithRetry.mockResolvedValue(json(200, { data: [raw('base1-4', 'Live Charizard')] }));
    expect((await getCards(['base1-4'])).map(c => c.name)).toEqual(['Live Charizard']);
  });

  it('falls back to the committed snapshot when the API keeps failing', async () => {
    fetchWithRetry.mockResolvedValue(json(500, {}));
    expect((await getCards(['base1-4', 'unknown-1'])).map(c => c.name)).toEqual(['Snapshot Charizard']);
  });

  it('throws when the API fails and the snapshot has none of the cards', async () => {
    fetchWithRetry.mockResolvedValue(json(500, {}));
    await expect(getCards(['unknown-1'])).rejects.toThrow();
  });
});

describe('getCard', () => {
  it('returns null for a 404 without consulting the snapshot', async () => {
    fetchWithRetry.mockResolvedValue(json(404, {}));
    expect(await getCard('base1-4')).toBeNull();
  });

  it('falls back to the snapshot on a 5xx', async () => {
    fetchWithRetry.mockResolvedValue(json(502, {}));
    expect((await getCard('base1-4'))?.name).toBe('Snapshot Charizard');
  });

  it('falls back to the snapshot on a network error', async () => {
    fetchWithRetry.mockRejectedValue(new TypeError('fetch failed'));
    expect((await getCard('base1-4'))?.name).toBe('Snapshot Charizard');
  });
});
