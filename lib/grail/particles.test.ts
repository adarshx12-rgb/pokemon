import { describe, expect, it } from 'vitest';
import { GOLDS, emissionCount, emit, step, type Emitter, type Particle } from './particles';

/** Deterministic random numbers so the tests never flake. */
const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const card: Emitter = { x: 500, y: 400, w: 300, h: 420, dir: -1 };

describe('emit', () => {
  it('never exceeds the cap', () => {
    const pool: Particle[] = [];
    emit(pool, 80, card, 50, seeded());
    expect(pool).toHaveLength(50);
    emit(pool, 10, card, 50, seeded(2));
    expect(pool).toHaveLength(50);
  });
  it('makes round gold dust with about 7% larger motes', () => {
    const pool: Particle[] = [];
    emit(pool, 2000, card, 2000, seeded(3));
    const motes = pool.filter(p => p.mote).length / pool.length;
    expect(motes).toBeGreaterThan(0.04);
    expect(motes).toBeLessThan(0.1);
    for (const p of pool) {
      expect(p.color).toBeGreaterThanOrEqual(0);
      expect(p.color).toBeLessThan(GOLDS.length);
      expect(p.size).toBeLessThanOrEqual(p.mote ? 8 : 2.9);
    }
  });
  it('starts at the card edges and drifts opposite the turn', () => {
    const pool: Particle[] = [];
    emit(pool, 500, card, 500, seeded(4));
    for (const p of pool) expect(Math.abs(p.x - card.x)).toBeGreaterThanOrEqual(card.w * 0.4 - 1e-9);
    expect(pool.filter(p => p.vx < 0).length / pool.length).toBeGreaterThan(0.95);
  });
});

describe('step', () => {
  it('moves particles and removes them when their life is over', () => {
    const pool: Particle[] = [];
    emit(pool, 100, card, 100, seeded(5));
    const before = pool[0].x;
    step(pool, 0.1);
    expect(pool[0].x).not.toBe(before);
    for (let i = 0; i < 20; i++) step(pool, 0.1); // 2.1s > max life 1.4s
    expect(pool).toHaveLength(0);
  });
});

describe('emissionCount', () => {
  it('carries fractional particles between frames', () => {
    let carry = 0;
    let total = 0;
    // 0.25 × 8/s × 0.125s = a quarter particle per frame (exact in binary, so no rounding drift)
    for (let i = 0; i < 40; i++) {
      const r = emissionCount(0.25, 0.125, 8, carry);
      carry = r.carry;
      total += r.count;
    }
    expect(total).toBe(10);
  });
});
