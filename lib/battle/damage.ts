import { typeMultiplier } from '@/data/typeChart';
import { randInt, type Rng } from './rng';
import type { Move, StatBlock, TypeName } from './types';

export const LEVEL = 50;
export const CRIT_CHANCE = 1 / 24;
const CRIT_MULTIPLIER = 1.5;

export interface Combatant { types: TypeName[]; stats: StatBlock }

export function baseDamage(power: number, attack: number, defense: number): number {
  const levelFactor = Math.floor((2 * LEVEL) / 5 + 2);
  return Math.floor(Math.floor((levelFactor * power * attack) / defense) / 50) + 2;
}

export function stab(moveType: TypeName, attackerTypes: TypeName[]): number {
  return attackerTypes.includes(moveType) ? 1.5 : 1;
}

function attackDefense(move: Move, attacker: StatBlock, defender: StatBlock): [number, number] {
  return move.damageClass === 'physical' ? [attacker.atk, defender.def] : [attacker.spa, defender.spd];
}

export function rollDamage(move: Move, attacker: Combatant, defender: Combatant, rng: Rng) {
  const effectiveness = typeMultiplier(move.type, defender.types);
  const crit = rng() < CRIT_CHANCE;
  if (effectiveness === 0) return { amount: 0, effectiveness, crit: false };
  const [a, d] = attackDefense(move, attacker.stats, defender.stats);
  const base = baseDamage(move.power, a, d);
  const randomPct = randInt(rng, 85, 100);
  const amount = Math.floor(
    (base * stab(move.type, attacker.types) * effectiveness * (crit ? CRIT_MULTIPLIER : 1) * randomPct) / 100,
  );
  return { amount: Math.max(1, amount), effectiveness, crit };
}

export function expectedDamage(move: Move, attacker: Combatant, defender: Combatant): number {
  const effectiveness = typeMultiplier(move.type, defender.types);
  if (effectiveness === 0) return 0;
  const [a, d] = attackDefense(move, attacker.stats, defender.stats);
  const accuracy = (move.accuracy ?? 100) / 100;
  return baseDamage(move.power, a, d) * stab(move.type, attacker.types) * effectiveness * accuracy;
}
