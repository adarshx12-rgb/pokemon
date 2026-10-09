import { describe, it, expect } from 'vitest';
import { EMPTY_TEAMS, randomFillCount, teamsReducer } from './teams';
import type { Move, TeamMember } from '@/lib/battle/types';

const mv = (name: string): Move => ({ name, type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' });
const mon = (name: string): TeamMember => ({
  pokemon: { id: 1, name, types: ['normal'], baseStats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
    sprites: { front: null, back: null, artwork: null }, movePool: [mv('a'), mv('b')] },
  moves: [mv('a')],
});
const six = Array.from({ length: 6 }, (_, i) => mon(`m${i}`));

describe('teamsReducer', () => {
  it('adds up to 6 and ignores extras', () => {
    let s = EMPTY_TEAMS;
    for (let i = 0; i < 7; i++) s = teamsReducer(s, { type: 'add', side: 'A', member: mon(`p${i}`) });
    expect(s.A).toHaveLength(6);
    expect(s.B).toHaveLength(0);
  });
  it('removes by index', () => {
    const s = teamsReducer({ A: [mon('x'), mon('y')], B: [] }, { type: 'remove', side: 'A', index: 0 });
    expect(s.A.map(m => m.pokemon.name)).toEqual(['y']);
  });
  it('replaces one move slot', () => {
    const s = teamsReducer({ A: [mon('x')], B: [] }, { type: 'setMove', side: 'A', index: 0, slot: 0, move: mv('b') });
    expect(s.A[0].moves[0].name).toBe('b');
  });
  it('fillRandom appends to empty slots, or replaces a full team', () => {
    const partial = teamsReducer({ A: [], B: [mon('keep')] }, { type: 'fillRandom', side: 'B', members: [mon('r1'), mon('r2')] });
    expect(partial.B.map(m => m.pokemon.name)).toEqual(['keep', 'r1', 'r2']);
    const full = teamsReducer({ A: [], B: six }, { type: 'fillRandom', side: 'B', members: [mon('z')] });
    expect(full.B.map(m => m.pokemon.name)).toEqual(['z']);
  });
});

describe('fillRandom with no members', () => {
  it('leaves a full team untouched instead of emptying it', () => {
    const s = teamsReducer({ A: [], B: six }, { type: 'fillRandom', side: 'B', members: [] });
    expect(s.B).toHaveLength(6);
  });
});

describe('randomFillCount', () => {
  it('fills empties, or the whole team when full', () => {
    expect(randomFillCount([])).toBe(6);
    expect(randomFillCount(six.slice(0, 4))).toBe(2);
    expect(randomFillCount(six)).toBe(6);
  });
});
