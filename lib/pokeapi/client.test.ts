import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchWithRetry = vi.fn();
vi.mock('@/lib/http', () => ({ fetchWithRetry: (...args: unknown[]) => fetchWithRetry(...args) }));

const { fetchPokemon, getPokemonNames, snapshotMove } = await import('./client');

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const learned = (name: string) => ({
  move: { name, url: `https://pokeapi.co/api/v2/move/${name}/` },
  version_group_details: [{ move_learn_method: { name: 'level-up' }, version_group: { name: 'red-blue' }, level_learned_at: 1 }],
});
const pikachu = (moves: string[]) => ({
  id: 25, name: 'pikachu', types: [{ slot: 1, type: { name: 'electric' } }],
  stats: [{ base_stat: 35, stat: { name: 'hp' } }],
  moves: moves.map(learned),
  sprites: { front_default: null, back_default: null },
});

beforeEach(() => {
  fetchWithRetry.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('snapshotMove', () => {
  it('reads bundled move definitions', () => {
    expect(snapshotMove('thunderbolt')).toMatchObject({ power: 90, type: { name: 'electric' }, damage_class: { name: 'special' } });
    expect(snapshotMove('not-a-move')).toBeNull();
  });
});

describe('fetchPokemon', () => {
  it('needs one request when every move is in the snapshot', async () => {
    fetchWithRetry.mockResolvedValue(json(200, pikachu(['thunderbolt', 'quick-attack', 'growl'])));
    const pokemon = await fetchPokemon('pikachu');
    expect(fetchWithRetry).toHaveBeenCalledTimes(1);
    expect(pokemon?.movePool.map(m => m.name).sort()).toEqual(['quick-attack', 'thunderbolt']);
  });

  it('fetches only moves newer than the snapshot', async () => {
    fetchWithRetry
      .mockResolvedValueOnce(json(200, pikachu(['thunderbolt', 'brand-new-zap'])))
      .mockResolvedValueOnce(json(200, { name: 'brand-new-zap', power: 80, accuracy: 100, type: { name: 'electric' }, damage_class: { name: 'special' } }));
    const pokemon = await fetchPokemon('pikachu');
    expect(fetchWithRetry).toHaveBeenCalledTimes(2);
    expect(fetchWithRetry.mock.calls[1][0]).toContain('/move/brand-new-zap/');
    expect(pokemon?.movePool.map(m => m.name)).toContain('brand-new-zap');
  });
});

describe('getPokemonNames', () => {
  it('falls back to the bundled list when PokéAPI is down', async () => {
    fetchWithRetry.mockRejectedValue(new Error('offline'));
    const names = await getPokemonNames();
    expect(names).toHaveLength(1025);
    expect(names).toContain('pikachu');
  });
});
