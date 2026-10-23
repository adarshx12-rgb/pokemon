import { levelMoveset } from '@/lib/battle/moves';
import type { BattlePokemon, TeamMember } from '@/lib/battle/types';

const TIMEOUT_MS = 30_000;

// Species data never changes during a visit, so re-adding or randomizing into a known Pokémon is instant.
const cache = new Map<string, Promise<BattlePokemon>>();

async function fetchPokemon(name: string): Promise<BattlePokemon> {
  let res: Response;
  try {
    res = await fetch(`/api/pokemon/${encodeURIComponent(name)}?v=4`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new Error('upstream');
  }
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error('upstream');
  return (await res.json()) as BattlePokemon;
}

export async function loadMember(name: string): Promise<TeamMember> {
  let pokemon = cache.get(name);
  if (!pokemon) {
    pokemon = fetchPokemon(name);
    cache.set(name, pokemon);
    pokemon.catch(() => cache.delete(name));
  }
  const loaded = await pokemon;
  return { pokemon: loaded, moves: levelMoveset(loaded.movePool, loaded.types) };
}
