import { autoMoveset } from '@/lib/battle/moves';
import type { BattlePokemon, TeamMember } from '@/lib/battle/types';

export async function loadMember(name: string): Promise<TeamMember> {
  const res = await fetch(`/api/pokemon/${encodeURIComponent(name)}`);
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error('upstream');
  const pokemon = (await res.json()) as BattlePokemon;
  return { pokemon, moves: autoMoveset(pokemon.movePool, pokemon.types) };
}
