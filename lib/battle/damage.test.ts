import { describe, it, expect } from 'vitest';
import { baseDamage, rollDamage, expectedDamage, stab, type Combatant } from './damage';
import type { Move } from './types';

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
      .toEqual({ amount: 292, effectiveness: 2, crit: true });
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
