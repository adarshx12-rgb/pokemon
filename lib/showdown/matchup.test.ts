import { describe, it, expect } from 'vitest';
import { coverage } from './matchup';
import type { Move, TeamMember, TypeName } from '@/lib/battle/types';

const mon = (types: TypeName[], moveTypes: TypeName[]): TeamMember => {
  const moves: Move[] = moveTypes.map(t => ({ name: t, type: t, power: 50, accuracy: 100, damageClass: 'special', pp: 10 }));
  return { pokemon: { id: 1, name: 'x', types, baseStats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }, sprites: { front: null, back: null, artwork: null }, movePool: moves }, moves };
};

describe('coverage', () => {
  it('counts defenders hit super-effectively by any attacker', () => {
    const attackers = [mon(['fire'], ['fire']), mon(['water'], ['water'])];
    const defenders = [mon(['grass'], []), mon(['rock'], []), mon(['dragon'], [])];
    expect(coverage(attackers, defenders)).toBe(2);
  });
  it('is 0 for empty teams', () => {
    expect(coverage([], [mon(['grass'], [])])).toBe(0);
  });
});
