import type { BattleEvent } from './types';

export const CHAR_MS = 28;
export const READ_PAUSE_MS = 600;

const DURATION: Record<BattleEvent['kind'], number> = { switchIn: 1200, useMove: 900, miss: 900, damage: 1100, stat: 900, recoil: 1100, withdraw: 900, faint: 1000, end: 1600 };

export const FULL_DRAIN_MS = 1500;

/** HP bar drain time: constant rate, a full bar empties in FULL_DRAIN_MS (capped at 300ms when reduced). */
export function drainMs(amount: number, maxHp: number, reduced = false): number {
  const ms = maxHp > 0 ? (FULL_DRAIN_MS * amount) / maxHp : 0;
  return reduced ? Math.min(ms, 300) : ms;
}

/** How long to show an event before the next one: its base duration (plus HP drain), or long enough to type and read its message. */
export function eventDelay(event: BattleEvent, message: string, speed: number, maxHp = 0, reduced = false): number {
  const drain = event.kind === 'damage' || event.kind === 'recoil' ? drainMs(event.amount, maxHp, reduced) : 0;
  return (Math.max(DURATION[event.kind], message.length * CHAR_MS + READ_PAUSE_MS) + drain) / speed;
}
