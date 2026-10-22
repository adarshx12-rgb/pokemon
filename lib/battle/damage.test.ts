import { describe, it, expect } from 'vitest';
import { baseDamage, rollDamage, expectedDamage, stab, type Combatant } from './damage';
import type { Move } from './types';
import { ZERO_STAGES } from './stages';

const flamethrower: Move = { name: 'flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special', pp: 10 };
const stats = (o: Partial<Combatant['stats']>) => ({ hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100, ...o });
const attacker: Combatant = { types: ['fire'], stats: stats({ spa: 161 }) };
const grassDefender: Combatant = { types: ['grass'], stats: stats({ spd: 100 }) };
const ghost: Combatant = { types: ['ghost'], stats: stats({}) };
const seq = (...values: number[]) => { let i = 0; return () => values[i++]; };

describe('baseDamage', () => {
  it('matches the hand-computed value', () => {
    // floor(floor(22 * 90 * 161 / 100) / 50) + 2 = floor(3187 / 50) + 2 = 65
    expect(baseDamage(90, 161, 100)).toBe(65);
  });
});

describe('stab', () => {
  it('is 1.5 when move type matches, else 1', () => {
    expect(stab('fire', ['fire', 'flying'])).toBe(1.5);
    expect(stab('water', ['fire'])).toBe(1);
  });
});

describe('rollDamage', () => {
  it('applies STAB, type, and max random roll', () => {
    // rng: 0.5 → no crit, 0.999 → random 100
    expect(rollDamage(flamethrower, attacker, grassDefender, seq(0.5, 0.999)))
      .toEqual({ amount: 195, effectiveness: 2, crit: false });
  });
  it('applies the minimum random roll', () => {
    expect(rollDamage(flamethrower, attacker, grassDefender, seq(0.5, 0)).amount).toBe(165);
  });
  it('applies a critical hit', () => {
    expect(rollDamage(flamethrower, attacker, grassDefender, seq(0.01, 0.999)))
      .toEqual({ amount: 390, effectiveness: 2, crit: true });
  });
  it('deals 0 to an immune target', () => {
    const tackle: Move = { name: 'tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical', pp: 10 };
    expect(rollDamage(tackle, attacker, ghost, seq(0.5, 0.5))).toEqual({ amount: 0, effectiveness: 0, crit: false });
  });
  it('deals at least 1 when not immune', () => {
    const weak: Move = { name: 'weak', type: 'fire', power: 1, accuracy: 100, damageClass: 'physical', pp: 10 };
    const tank: Combatant = { types: ['water', 'rock'], stats: stats({ def: 999 }) };
    const frail: Combatant = { types: ['normal'], stats: stats({ atk: 1 }) };
    expect(rollDamage(weak, frail, tank, seq(0.5, 0)).amount).toBe(1);
  });
});

describe('expectedDamage', () => {
  it('uses no randomness or crit and scales by accuracy', () => {
    expect(expectedDamage(flamethrower, attacker, grassDefender)).toBe(195);
    expect(expectedDamage({ ...flamethrower, accuracy: 50 }, attacker, grassDefender)).toBe(97.5);
  });
});

describe('stages and crits (Gen 4)', () => {
  const noCrit = (r: number) => seq(0.5, r);
  const crit = (r: number) => seq(0.0, r);
  it('crit doubles damage', () => {
    const a = rollDamage(flamethrower, attacker, grassDefender, noCrit(0.5));
    const b = rollDamage(flamethrower, attacker, grassDefender, crit(0.5));
    expect(b.crit).toBe(true);
    expect(b.amount).toBe(a.amount * 2);
  });
  it("crit ignores the attacker's lowered Attack and the defender's raised Defense", () => {
    const stages = { attacker: { ...ZERO_STAGES, spa: -3 }, defender: { ...ZERO_STAGES, spd: 3 } };
    const plain = rollDamage(flamethrower, attacker, grassDefender, crit(0.5));
    const staged = rollDamage(flamethrower, attacker, grassDefender, crit(0.5), stages);
    expect(staged.amount).toBe(plain.amount);
    const nonCrit = rollDamage(flamethrower, attacker, grassDefender, noCrit(0.5), stages);
    expect(nonCrit.amount).toBeLessThan(plain.amount / 2);
  });
  it('+2 Attack doubles the attacking stat', () => {
    const base = rollDamage(flamethrower, attacker, grassDefender, noCrit(0.5)).amount;
    const boosted = rollDamage(flamethrower, attacker, grassDefender, noCrit(0.5),
      { attacker: { ...ZERO_STAGES, spa: 2 }, defender: ZERO_STAGES }).amount;
    expect(boosted).toBeGreaterThan(base * 1.9);
    expect(boosted).toBeLessThanOrEqual(base * 2 + 4);
  });
  it('struggle is typeless', () => {
    const struggle: Move = { name: 'struggle', type: 'normal', power: 50, accuracy: null, damageClass: 'physical', pp: 1 };
    const r = rollDamage(struggle, { types: ['normal'], stats: stats({}) }, ghost, noCrit(0.5));
    expect(r.effectiveness).toBe(1);
    expect(r.amount).toBeGreaterThan(0);
  });
});
