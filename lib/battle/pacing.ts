import type { BattleEvent } from './types';

export const CHAR_MS = 28;
export const READ_PAUSE_MS = 600;

const DURATION: Record<BattleEvent['kind'], number> = { switchIn: 1200, useMove: 900, miss: 900, damage: 1100, faint: 1000, end: 1600 };

/** How long to show an event before the next one: its base duration, or long enough to type and read its message. */
export function eventDelay(kind: BattleEvent['kind'], message: string, speed: number): number {
  return Math.max(DURATION[kind], message.length * CHAR_MS + READ_PAUSE_MS) / speed;
}
