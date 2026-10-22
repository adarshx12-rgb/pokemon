import { describe, it, expect } from 'vitest';
import { eventDelay, drainMs, CHAR_MS, READ_PAUSE_MS, FULL_DRAIN_MS } from './pacing';
import type { BattleEvent } from './types';

const useMove = { kind: 'useMove', side: 'A', index: 0, ppLeft: 1,
  move: { name: 'x', type: 'fire', power: 1, accuracy: 100, damageClass: 'special', pp: 5 } } as BattleEvent;

describe('eventDelay', () => {
  it('uses the event duration when the message types out in time', () => {
    expect(eventDelay(useMove, 'Go!', 1)).toBe(900);
  });
  it('waits for a long message to finish typing plus a reading pause', () => {
    const msg = "The foe's CHARIZARD used FLAMETHROWER!";
    expect(eventDelay(useMove, msg, 1)).toBe(msg.length * CHAR_MS + READ_PAUSE_MS);
  });
  it('scales with speed', () => {
    const msg = "The foe's CHARIZARD used FLAMETHROWER!";
    expect(eventDelay(useMove, msg, 4)).toBe((msg.length * CHAR_MS + READ_PAUSE_MS) / 4);
  });
  it('adds the HP drain for damage and recoil', () => {
    const dmg = { kind: 'damage', side: 'B', index: 0, amount: 50, hpAfter: 50, effectiveness: 1, crit: false } as BattleEvent;
    expect(eventDelay(dmg, '', 1, 100)).toBe(1100 + 750);
    const rec = { kind: 'recoil', side: 'B', index: 0, amount: 25, hpAfter: 75 } as BattleEvent;
    expect(eventDelay(rec, '', 1, 100)).toBe(1100 + 375);
  });
  it('caps the HP drain at 300ms when reduced', () => {
    const dmg = { kind: 'damage', side: 'B', index: 0, amount: 50, hpAfter: 50, effectiveness: 1, crit: false } as BattleEvent;
    expect(eventDelay(dmg, '', 1, 100, true)).toBe(1100 + 300);
  });
});

describe('drainMs', () => {
  it('drains at a constant rate', () => {
    expect(FULL_DRAIN_MS).toBe(1500);
    expect(drainMs(50, 100)).toBe(750);
  });
  it('caps at 300ms when reduced', () => {
    expect(drainMs(100, 100, true)).toBe(300);
  });
});
