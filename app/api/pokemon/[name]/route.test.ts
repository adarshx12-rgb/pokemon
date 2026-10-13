import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchPokemon = vi.fn();
vi.mock('@/lib/pokeapi/client', () => ({ fetchPokemon: (...args: unknown[]) => fetchPokemon(...args) }));

const { GET } = await import('./route');

const call = (name: string) => GET(new Request('https://pokefame.com/api/pokemon/x'), { params: Promise.resolve({ name }) });

beforeEach(() => fetchPokemon.mockReset());

describe('GET /api/pokemon/[name]', () => {
  it('rejects names that are not PokéAPI slugs without calling upstream', async () => {
    for (const name of ['../../berry/1', 'pika<script>', 'a'.repeat(41), '', '%00']) {
      const res = await call(name);
      expect(res.status).toBe(400);
    }
    expect(fetchPokemon).not.toHaveBeenCalled();
  });

  it('normalises display names to slugs and serves the result', async () => {
    fetchPokemon.mockResolvedValue({ name: 'mr-mime' });
    const res = await call('Mr. Mime');
    expect(fetchPokemon).toHaveBeenCalledWith('mr-mime');
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown Pokémon and 502 when PokéAPI fails', async () => {
    fetchPokemon.mockResolvedValueOnce(null);
    expect((await call('missingno')).status).toBe(404);
    fetchPokemon.mockRejectedValueOnce(new Error('down'));
    expect((await call('pikachu')).status).toBe(502);
  });
});
