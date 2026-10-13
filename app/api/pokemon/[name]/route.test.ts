import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fetchPokemon = vi.fn();
vi.mock('@/lib/pokeapi/client', () => ({ fetchPokemon: (...args: unknown[]) => fetchPokemon(...args) }));

const { GET } = await import('./route');

const call = (name: string) => GET(new Request('https://pokefame.com/api/pokemon/x'), { params: Promise.resolve({ name }) });

beforeEach(() => fetchPokemon.mockReset());
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/pokemon/[name]', () => {
  it('rejects names that are not PokéAPI slugs without calling upstream', async () => {
    for (const name of ['../../berry/1', 'pika<script>', 'a'.repeat(41), '', '%00']) {
      expect((await call(name)).status).toBe(400);
    }
    expect(fetchPokemon).not.toHaveBeenCalled();
  });

  it('answers 404 for well-formed names outside the national dex without calling upstream', async () => {
    for (const name of ['missingno', 'aaaa', 'pikachu-123']) expect((await call(name)).status).toBe(404);
    expect(fetchPokemon).not.toHaveBeenCalled();
  });

  it('normalises display names to slugs and serves the result', async () => {
    fetchPokemon.mockResolvedValue({ name: 'mr-mime' });
    const res = await call('Mr. Mime');
    expect(fetchPokemon).toHaveBeenCalledWith('mr-mime');
    expect(res.status).toBe(200);
  });

  it('returns 502 when PokéAPI fails', async () => {
    fetchPokemon.mockRejectedValueOnce(new Error('down'));
    expect((await call('pikachu')).status).toBe(502);
  });

  it('serves repeat requests from the edge cache, keyed by slug', async () => {
    const store = new Map<string, Response>();
    vi.stubGlobal('caches', { open: async () => ({
      match: async (key: string) => store.get(key)?.clone(),
      put: async (key: string, res: Response) => void store.set(key, res),
    }) });
    fetchPokemon.mockResolvedValue({ name: 'pikachu' });
    for (const name of ['pikachu', 'Pikachu', ' PIKACHU ']) expect((await call(name)).status).toBe(200);
    expect(fetchPokemon).toHaveBeenCalledTimes(1);
    expect(await (await call('pikachu')).json()).toEqual({ name: 'pikachu' });
  });
});
