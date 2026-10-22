import { describe, it, expect } from 'vitest';
import { autoMoveset, chooseMove, STRUGGLE } from './moves';
import type { Combatant } from './damage';
import type { Move } from './types';

const m = (name: string, type: Move['type'], power: number, damageClass: Move['damageClass'] = 'special', accuracy: number | null = 100): Move =>
  ({ name, type, power, accuracy, damageClass, pp: 10 });

describe('autoMoveset', () => {
  it('prioritizes natural attacks, fills from legal coverage, and never repeats moves', () => {
    const pool = [
      { ...m('hydro-pump', 'water', 110), learnMethods: ['level-up'] },
      { ...m('aqua-tail', 'water', 90), learnMethods: ['level-up'] },
      { ...m('bite', 'dark', 60), learnMethods: ['level-up'] },
      { ...m('ice-beam', 'ice', 90), learnMethods: ['machine'] },
      { ...m('water-spout', 'water', 150), learnMethods: ['egg'] },
    ];
    const selected = autoMoveset([...pool, pool[0]], ['water']);
    expect(selected.map(move => move.name)).toEqual(['hydro-pump', 'aqua-tail', 'bite', 'ice-beam']);
    expect(new Set(selected.map(move => move.name)).size).toBe(selected.length);
  });
  it('returns Struggle for an empty pool', () => {
    expect(autoMoveset([], ['normal'])).toEqual([STRUGGLE]);
  });
  it('picks the 4 strongest with at most 2 moves per type', () => {
    const pool = [
      m('blast-burn', 'fire', 150), m('fire-blast', 'fire', 110, 'special', 85), m('flamethrower', 'fire', 90),
      m('hydro-pump', 'water', 110, 'special', 80), m('hyper-beam', 'normal', 150, 'special', 90), m('ember', 'fire', 40),
    ];
    // scores: blast-burn 225, fire-blast 140.25, flamethrower 135, hyper-beam 135, hydro-pump 88, ember 60
    // flamethrower is skipped as the third fire move
    expect(autoMoveset(pool, ['fire']).map(x => x.name))
      .toEqual(['blast-burn', 'fire-blast', 'hyper-beam', 'hydro-pump']);
  });
  it('fills past the type cap when the pool is short on variety', () => {
    const pool = [m('a', 'fire', 100), m('b', 'fire', 90), m('c', 'fire', 80)];
    expect(autoMoveset(pool, ['fire']).map(x => x.name)).toEqual(['a', 'b', 'c']);
  });
  it('returns fewer than 4 when the pool is smaller', () => {
    expect(autoMoveset([m('a', 'fire', 100)], ['fire'])).toHaveLength(1);
  });
});

describe('chooseMove', () => {
  const s = { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const fireMon: Combatant = { types: ['fire'], stats: s };
  const moves = [m('flamethrower', 'fire', 90), m('earthquake', 'ground', 100, 'physical')];
  it('picks the super-effective STAB move vs grass', () => {
    expect(chooseMove(moves, fireMon, { types: ['grass'], stats: s }).name).toBe('flamethrower');
  });
  it('switches to the better move vs water', () => {
    expect(chooseMove(moves, fireMon, { types: ['water'], stats: s }).name).toBe('earthquake');
  });
  it('falls back to Struggle with no moves', () => {
    expect(chooseMove([], fireMon, { types: ['water'], stats: s })).toEqual(STRUGGLE);
  });
});
