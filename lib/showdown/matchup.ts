import { typeMultiplier } from '@/data/typeChart';
import type { TeamMember } from '@/lib/battle/types';

export function coverage(attackers: TeamMember[], defenders: TeamMember[]): number {
  return defenders.filter(d =>
    attackers.some(a => a.moves.some(m => typeMultiplier(m.type, d.pokemon.types) >= 2)),
  ).length;
}
