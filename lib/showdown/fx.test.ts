import { describe, expect, it } from 'vitest';
import { TYPE_NAMES, type BattleEvent, type Move } from '@/lib/battle/types';
import { fxAt, fxFor, SEND_OUT_MS, stepMs, TYPE_FX } from './fx';

const move = (over: Partial<Move>): Move => ({ name: 'm', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical', pp: 10, ...over });

describe('fxFor', () => {
  it('lunges for physical moves and fires a projectile for special ones', () => {
    expect(fxFor(move({ damageClass: 'physical' }))).toBe('contact');
    expect(fxFor(move({ damageClass: 'special' }))).toBe('projectile');
  });
  it('follows the sign of the stat change for status moves', () => {
    const growl = move({ damageClass: 'status', power: 0, statChanges: [{ stat: 'atk', change: -1 }], target: 'foe' });
    const dance = move({ damageClass: 'status', power: 0, statChanges: [{ stat: 'atk', change: 2 }], target: 'self' });
    expect(fxFor(dance, 2)).toBe('stat-up');
    expect(fxFor(growl, -1)).toBe('stat-down');
    expect(fxFor(growl)).toBe('stat-down');
    expect(fxFor(dance)).toBe('stat-up');
    expect(fxFor(growl, 0)).toBe('stat-down'); // no change left: falls back to the move's direction
  });
});

describe('TYPE_FX', () => {
  it('has a colour and a shape for every type', () => {
    expect(Object.keys(TYPE_FX).sort()).toEqual([...TYPE_NAMES].sort());
    for (const t of TYPE_NAMES) {
      expect(TYPE_FX[t].color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TYPE_FX[t].shape).toBeTruthy();
    }
  });
  it('gives each type its own look', () => {
    const looks = new Set(TYPE_NAMES.map(t => `${TYPE_FX[t].shape}${TYPE_FX[t].color}`));
    expect(looks.size).toBe(TYPE_NAMES.length);
  });
});

describe('fxAt', () => {
  const flame = move({ type: 'fire', damageClass: 'special' });
  const growl = move({ damageClass: 'status', power: 0, statChanges: [{ stat: 'atk', change: -1 }], target: 'foe' });
  const use = (m: Move): BattleEvent => ({ kind: 'useMove', side: 'A', index: 0, move: m, ppLeft: 1 });
  const hit = (amount: number): BattleEvent => ({ kind: 'damage', side: 'B', index: 0, amount, hpAfter: 50, effectiveness: amount ? 1 : 0, crit: false });

  it('animates a damaging move only when it lands', () => {
    expect(fxAt([use(flame), hit(10)], 0)).toEqual({ style: 'projectile', type: 'fire', from: 'A' });
    expect(fxAt([use(flame), { kind: 'miss', side: 'A', index: 0 }], 0)).toBeNull();
    expect(fxAt([use(flame), hit(0)], 0)).toBeNull();
    expect(fxAt([use(flame), hit(10)], 1)).toBeNull();
  });
  it('glows the affected side on a stat change', () => {
    const events: BattleEvent[] = [use(growl), { kind: 'stat', side: 'B', index: 0, stat: 'atk', change: -1, applied: -1 }];
    expect(fxAt(events, 0)).toBeNull();
    expect(fxAt(events, 1)).toEqual({ style: 'stat-down', type: 'normal', from: 'B' });
    expect(fxAt([use(growl), { kind: 'stat', side: 'B', index: 0, stat: 'atk', change: -1, applied: 0 }], 1)).toBeNull();
  });
});

describe('stepMs', () => {
  it('holds a send-out long enough to play, and nothing with reduced motion', () => {
    const e: BattleEvent = { kind: 'switchIn', side: 'B', index: 0, hp: 1, maxHp: 1 };
    expect(stepMs(e, null, false)).toBe(SEND_OUT_MS);
    expect(stepMs(e, null, true)).toBe(0);
    expect(stepMs({ kind: 'miss', side: 'A', index: 0 }, null, false)).toBe(0);
  });
});
