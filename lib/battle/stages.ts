import type { StageStat } from './types';

export type Stages = Record<StageStat, number>;

export const ZERO_STAGES: Stages = Object.freeze({
  atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0,
}) as Stages;

const MAX_STAGE = 6;
const clamp = (n: number, lo = -MAX_STAGE, hi = MAX_STAGE) => Math.max(lo, Math.min(hi, n));

export function statMultiplier(stage: number): number {
  const n = clamp(stage);
  return n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
}

export function accuracyMultiplier(stage: number): number {
  const n = clamp(stage);
  return n >= 0 ? (3 + n) / 3 : 3 / (3 - n);
}

export function applyStage(stages: Stages, stat: StageStat, change: number): { stages: Stages; applied: number } {
  const next = clamp(stages[stat] + change);
  return { stages: { ...stages, [stat]: next }, applied: next - stages[stat] };
}

export function hitChance(accuracy: number | null, attackerAcc: number, defenderEva: number): number {
  if (accuracy === null) return 1;
  return (accuracy / 100) * accuracyMultiplier(clamp(attackerAcc - defenderEva));
}
