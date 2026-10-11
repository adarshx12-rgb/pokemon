import { expectedDamage, stab, type Combatant } from './damage';
import type { Move, TypeName } from './types';

export const STRUGGLE: Move = { name: 'struggle', type: 'normal', power: 50, accuracy: null, damageClass: 'physical' };

const MAX_PER_TYPE = 2;

function moveScore(move: Move, types: TypeName[]): number {
  return ((move.power * (move.accuracy ?? 100)) / 100) * stab(move.type, types);
}

export function autoMoveset(pool: Move[], types: TypeName[]): Move[] {
  if (pool.length === 0) return [STRUGGLE];
  const unique = [...new Map(pool.map(move => [move.name, move])).values()];
  // Start with the species' natural attacks, then fill coverage from its other legal moves.
  const natural = (move: Move) => Number(move.learnMethods?.includes('level-up') ?? false);
  const ranked = unique.sort((a, b) => natural(b) - natural(a) || moveScore(b, types) - moveScore(a, types) || a.name.localeCompare(b.name));
  const picked: Move[] = [];
  const perType = new Map<TypeName, number>();
  for (const move of ranked) {
    if (picked.length === 4) break;
    const n = perType.get(move.type) ?? 0;
    if (n >= MAX_PER_TYPE) continue;
    picked.push(move);
    perType.set(move.type, n + 1);
  }
  for (const move of ranked) {
    if (picked.length === 4) break;
    if (!picked.includes(move)) picked.push(move);
  }
  return picked;
}

export function chooseMove(moves: Move[], attacker: Combatant, defender: Combatant): Move {
  if (moves.length === 0) return STRUGGLE;
  let best = moves[0];
  let bestValue = expectedDamage(best, attacker, defender);
  for (const move of moves.slice(1)) {
    const value = expectedDamage(move, attacker, defender);
    if (value > bestValue) { best = move; bestValue = value; }
  }
  return best;
}
