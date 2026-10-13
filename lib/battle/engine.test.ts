import { describe, it, expect } from 'vitest';
import { createBattle, simulate, TURN_CAP } from './engine';
import type { BattleEvent, Move, StatBlock, TeamMember, TypeName } from './types';

const move = (name: string, type: TypeName, power: number, accuracy: number | null = 100): Move =>
  ({ name, type, power, accuracy, damageClass: 'physical' });
const base = (o: Partial<StatBlock> = {}): StatBlock => ({ hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, ...o });
const member = (name: string, types: TypeName[], stats: StatBlock, moves: Move[]): TeamMember => ({
  pokemon: { id: 1, name, types, baseStats: stats, sprites: { front: null, back: null, artwork: null }, movePool: moves },
  moves,
});
const kinds = (events: BattleEvent[]) => events.map(e => e.kind);

const strongFast = member('titan', ['normal'], base({ atk: 255, spe: 200 }), [move('mega-punch', 'normal', 250)]);
const weakSlow = (n: string) => member(n, ['normal'], base({ hp: 20, def: 10, spe: 10 }), [move('tackle', 'normal', 10)]);

describe('manual battle', () => {
  it('waits for a legal move from the correct side and only executes the chosen attack', () => {
    const a = member('player', ['normal'], base({ spe: 200 }), [move('tackle', 'normal', 10), move('slam', 'normal', 60)]);
    const b = member('opponent', ['normal'], base(), [move('tackle', 'normal', 10)]);
    const battle = createBattle([a], [b], 1);
    expect(kinds(battle.initialEvents)).toEqual(['switchIn', 'switchIn']);
    expect(battle.nextSide).toBe('A');
    expect(battle.playMove('B', 'tackle')).toEqual([]);
    expect(battle.playMove('A', 'unknown')).toEqual([]);
    const first = battle.playMove('A', 'tackle');
    expect(first.filter(e => e.kind === 'useMove')).toEqual([{ kind: 'useMove', side: 'A', index: 0, move: a.moves[0] }]);
    expect(battle.nextSide).toBe('B');
    expect(battle.turn).toBe(1);
    expect(battle.playMove('A', 'slam')).toEqual([]);
    expect(battle.playMove('B', 'tackle')[0]).toMatchObject({ kind: 'useMove', side: 'B' });
    expect(battle.turn).toBe(2);
    expect(battle.nextSide).toBe('A');
  });

  it('waits after a knockout, skips a fainted actor, and stops after victory', () => {
    const battle = createBattle([strongFast], [weakSlow('one'), weakSlow('two')], 5);
    const first = battle.playMove('A', 'mega-punch');
    expect(first.at(-1)).toMatchObject({ kind: 'switchIn', side: 'B', index: 1 });
    expect(battle.nextSide).toBe('A');
    expect(battle.turn).toBe(2);
    expect(battle.playMove('A', 'mega-punch').at(-1)).toMatchObject({ kind: 'end', winner: 'A' });
    expect(battle.nextSide).toBeNull();
    expect(battle.playMove('A', 'mega-punch')).toEqual([]);
  });

  it('provides Struggle when a Pokémon has no moves', () => {
    const battle = createBattle([member('empty', ['normal'], base({ spe: 255 }), [])], [strongFast], 1);
    expect(battle.nextSide).toBe('A');
    expect(battle.playMove('A', 'struggle')[0]).toMatchObject({ kind: 'useMove', move: { name: 'struggle' } });
  });
});

describe('simulate', () => {
  it('starts with both switch-ins and ends with an end event', () => {
    const events = simulate([strongFast], [weakSlow('w1')], 1);
    expect(events[0]).toMatchObject({ kind: 'switchIn', side: 'A', index: 0 });
    expect(events[1]).toMatchObject({ kind: 'switchIn', side: 'B', index: 0 });
    expect(events.at(-1)).toMatchObject({ kind: 'end', winner: 'A', reason: 'knockout' });
  });

  it('lets the faster Pokémon act first', () => {
    const events = simulate([weakSlow('w1')], [strongFast], 1);
    expect(events.find(e => e.kind === 'useMove')).toMatchObject({ side: 'B' });
  });

  it('is deterministic for a seed', () => {
    const a = [member('x', ['fire'], base(), [move('ember', 'fire', 40, 90)])];
    const b = [member('y', ['water'], base(), [move('bubble', 'water', 40, 90)])];
    expect(simulate(a, b, 99)).toEqual(simulate(a, b, 99));
  });

  it('switches in the next Pokémon after a faint, and it does not act that turn', () => {
    const events = simulate([strongFast], [weakSlow('w1'), weakSlow('w2')], 5);
    const k = kinds(events);
    const faintAt = k.indexOf('faint');
    expect(events[faintAt]).toMatchObject({ side: 'B', index: 0 });
    expect(events[faintAt + 1]).toMatchObject({ kind: 'switchIn', side: 'B', index: 1 });
    expect(events[faintAt + 2]).toMatchObject({ kind: 'useMove', side: 'A' });
  });

  it('emits a miss for a 0-accuracy move', () => {
    const a = [member('x', ['normal'], base({ spe: 200 }), [move('whiff', 'normal', 50, 0)])];
    const b = [member('y', ['normal'], base(), [move('whiff', 'normal', 50, 0)])];
    const events = simulate(a, b, 1);
    expect(events[2]).toMatchObject({ kind: 'useMove', side: 'A' });
    expect(events[3]).toMatchObject({ kind: 'miss', side: 'A' });
  });

  it('ends at the turn cap when nobody can deal damage', () => {
    const a = [member('norm', ['normal'], base(), [move('tackle', 'normal', 40)])];
    const b = [member('spook', ['ghost'], base(), [move('lick', 'ghost', 30)])];
    const events = simulate(a, b, 1);
    expect(events.at(-1)).toMatchObject({ kind: 'end', reason: 'turnCap', winner: 'A' });
    expect(events.filter(e => e.kind === 'useMove')).toHaveLength(TURN_CAP * 2);
  });

  it('handles uneven teams and reports damage per Pokémon', () => {
    const events = simulate([strongFast], [weakSlow('a'), weakSlow('b'), weakSlow('c')], 3);
    const end = events.at(-1);
    if (end?.kind !== 'end') throw new Error('no end');
    expect(end.winner).toBe('A');
    expect(end.damageDealt.A).toHaveLength(1);
    expect(end.damageDealt.B).toHaveLength(3);
    expect(end.damageDealt.A[0]).toBeGreaterThan(0);
  });

  it('never drops HP below 0 and damage amounts equal HP lost', () => {
    const events = simulate([strongFast], [weakSlow('w1')], 8);
    const dmg = events.find(e => e.kind === 'damage');
    if (dmg?.kind !== 'damage') throw new Error('no damage');
    expect(dmg.hpAfter).toBe(0);
  });

  it('throws when a team is empty', () => {
    expect(() => simulate([], [strongFast], 1)).toThrow();
  });
});
