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
  it('reorders complete members without changing their moves or the other team', () => {
    const original = { A: [mon('first'), mon('second'), mon('third')], B: [mon('rival')] };
    const s = teamsReducer(original, { type: 'reorder', side: 'A', from: 2, to: 0 });
    expect(s.A.map(m => m.pokemon.name)).toEqual(['third', 'first', 'second']);
    expect(s.A[0]).toBe(original.A[2]);
    expect(s.B).toBe(original.B);
    expect(original.A.map(m => m.pokemon.name)).toEqual(['first', 'second', 'third']);
    expect(teamsReducer(s, { type: 'reorder', side: 'A', from: 0, to: 2 }).A).toEqual(original.A);
  });
  it('ignores invalid and empty-slot reorder targets', () => {
    const s = { A: [mon('first'), mon('second')], B: [] };
    for (const [from, to] of [[-1, 0], [0, 6], [0, 2], [3, 0], [0.5, 1], [0, 0]]) {
      expect(teamsReducer(s, { type: 'reorder', side: 'A', from, to })).toBe(s);
    }
  });
  it('clears only the requested team', () => {
    const s = { A: six, B: [mon('rival')] };
    const cleared = teamsReducer(s, { type: 'clear', side: 'A' });
    expect(cleared.A).toEqual([]);
    expect(cleared.B).toBe(s.B);
  });
  it('replaces one move slot', () => {
    const s = teamsReducer({ A: [mon('x')], B: [] }, { type: 'setMove', side: 'A', index: 0, slot: 0, move: mv('b') });
    expect(s.A[0].moves[0].name).toBe('b');
  });
  it('rejects foreign moves and repeated moves, and uses canonical learned move data', () => {
    const member = mon('blastoise');
    const original = { A: [member], B: [] };
    expect(teamsReducer(original, { type: 'setMove', side: 'A', index: 0, slot: 0, move: mv('thunderbolt') })).toBe(original);
    const edited = teamsReducer(original, { type: 'setMove', side: 'A', index: 0, slot: 0, move: { ...mv('b'), power: 999 } });
    expect(edited.A[0].moves[0]).toBe(member.pokemon.movePool[1]);
    const twoMoves = { A: [{ ...member, moves: member.pokemon.movePool }], B: [] };
    expect(teamsReducer(twoMoves, { type: 'setMove', side: 'A', index: 0, slot: 0, move: mv('b') })).toBe(twoMoves);
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
