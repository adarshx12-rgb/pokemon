import { typeMultiplier } from '@/data/typeChart';
import { randInt, type Rng } from './rng';
import { statMultiplier, type Stages } from './stages';
import type { Move, StatBlock, TypeName } from './types';

export const LEVEL = 50;
export const CRIT_CHANCE = 1 / 16;
const CRIT_MULTIPLIER = 2;
const STRUGGLE_NAME = 'struggle';

export interface Combatant { types: TypeName[]; stats: StatBlock }
export interface StageContext { attacker: Stages; defender: Stages }

export function baseDamage(power: number, attack: number, defense: number): number {
  const levelFactor = Math.floor((2 * LEVEL) / 5 + 2);
  return Math.floor(Math.floor((levelFactor * power * attack) / defense) / 50) + 2;
}

export function stab(moveType: TypeName, attackerTypes: TypeName[]): number {
  return attackerTypes.includes(moveType) ? 1.5 : 1;
}

function attackDefense(move: Move, attacker: StatBlock, defender: StatBlock, stages?: StageContext, crit = false): [number, number] {
  const physical = move.damageClass === 'physical';
  const aKey = physical ? 'atk' : 'spa';
  const dKey = physical ? 'def' : 'spd';
  let aStage = stages?.attacker[aKey] ?? 0;
  let dStage = stages?.defender[dKey] ?? 0;
  if (crit) { aStage = Math.max(0, aStage); dStage = Math.min(0, dStage); }
  return [
    Math.max(1, Math.floor(attacker[aKey] * statMultiplier(aStage))),
    Math.max(1, Math.floor(defender[dKey] * statMultiplier(dStage))),
  ];
}

function moveEffectiveness(move: Move, defender: Combatant): number {
  return move.name === STRUGGLE_NAME ? 1 : typeMultiplier(move.type, defender.types);
}

export function rollDamage(move: Move, attacker: Combatant, defender: Combatant, rng: Rng, stages?: StageContext) {
  const effectiveness = moveEffectiveness(move, defender);
  const crit = rng() < CRIT_CHANCE;
  if (effectiveness === 0) return { amount: 0, effectiveness, crit: false };
  const [a, d] = attackDefense(move, attacker.stats, defender.stats, stages, crit);
  const base = baseDamage(move.power, a, d);
  const randomPct = randInt(rng, 85, 100);
  const bonus = move.name === STRUGGLE_NAME ? 1 : stab(move.type, attacker.types);
  const amount = Math.floor((base * bonus * effectiveness * (crit ? CRIT_MULTIPLIER : 1) * randomPct) / 100);
  return { amount: Math.max(1, amount), effectiveness, crit };
}

export function expectedDamage(move: Move, attacker: Combatant, defender: Combatant, stages?: StageContext): number {
  const effectiveness = moveEffectiveness(move, defender);
  if (effectiveness === 0) return 0;
  const [a, d] = attackDefense(move, attacker.stats, defender.stats, stages);
  const accuracy = (move.accuracy ?? 100) / 100;
  const bonus = move.name === STRUGGLE_NAME ? 1 : stab(move.type, attacker.types);
  return baseDamage(move.power, a, d) * bonus * effectiveness * accuracy;
}
