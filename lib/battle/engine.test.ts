import { describe, it, expect } from 'vitest';
import { createBattle, simulate, TURN_CAP } from './engine';
import type { BattleEvent, Move, StageStat, StatBlock, TeamMember, TypeName } from './types';

const move = (name: string, type: TypeName, power: number, accuracy: number | null = 100): Move =>
  ({ name, type, power, accuracy, damageClass: 'physical', pp: 10 });
const base = (o: Partial<StatBlock> = {}): StatBlock => ({ hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, ...o });
const member = (name: string, types: TypeName[], stats: StatBlock, moves: Move[]): TeamMember => ({
  pokemon: { id: 1, name, types, baseStats: stats, sprites: { front: null, back: null, artwork: null }, movePool: moves },
  moves,
});
const kinds = (events: BattleEvent[]) => events.map(e => e.kind);
const statMove = (name: string, stat: StageStat, change: number, target: 'self' | 'foe', accuracy: number | null = 100): Move =>
  ({ name, type: 'normal', power: 0, accuracy, damageClass: 'status', pp: 30, statChanges: [{ stat, change }], target });

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
    expect(first.filter(e => e.kind === 'useMove')).toEqual([{ kind: 'useMove', side: 'A', index: 0, move: a.moves[0], ppLeft: 9 }]);
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
    expect(first.at(-1)).toMatchObject({ kind: 'faint', side: 'B', index: 0 });
    expect(battle.replacing).toBe('B');
    expect(battle.replace('B', 1)).toEqual([{ kind: 'switchIn', side: 'B', index: 1, hp: expect.any(Number), maxHp: expect.any(Number) }]);
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

describe('PP, stat moves, Struggle and switching', () => {
  const fastA = (moves: Move[]) => member('fast', ['normal'], base({ spe: 200 }), moves);
  const sturdy = () => member('sturdy', ['normal'], base({ hp: 255, def: 255 }), [move('tackle', 'normal', 10)]);

  it('spends PP and reports what is left', () => {
    const a = fastA([{ ...move('tackle', 'normal', 10), pp: 2 }, move('pound', 'normal', 10)]);
    const battle = createBattle([a], [sturdy()], 1);
    expect(battle.ppLeft('A', 0)).toEqual([2, 10]);
    expect(battle.playMove('A', 'tackle')[0]).toMatchObject({ kind: 'useMove', ppLeft: 1 });
    battle.playMove('B', 'tackle');
    expect(battle.playMove('A', 'tackle')[0]).toMatchObject({ kind: 'useMove', ppLeft: 0 });
    battle.playMove('B', 'tackle');
    expect(battle.ppLeft('A', 0)).toEqual([0, 10]);
    expect(battle.playMove('A', 'tackle')).toEqual([]);
    expect(battle.bestMove()).toBe('pound');
  });

  it('falls back to Struggle when out of PP', () => {
    const a = fastA([{ ...move('tackle', 'normal', 10), pp: 1 }]);
    const battle = createBattle([a], [sturdy()], 1);
    battle.playMove('A', 'tackle');
    battle.playMove('B', 'tackle');
    expect(battle.playMove('A', 'tackle')).toEqual([]);
    expect(battle.bestMove()).toBe('struggle');
    const events = battle.playMove('A', 'struggle');
    expect(kinds(events)).toEqual(['useMove', 'damage', 'recoil']);
    const maxHp = (battle.initialEvents[0] as Extract<BattleEvent, { kind: 'switchIn' }>).maxHp;
    expect(events[2]).toMatchObject({ kind: 'recoil', side: 'A', index: 0, amount: Math.floor(maxHp / 4) });
  });

  it('applies stat moves to the right Pokémon', () => {
    const a = fastA([statMove('growl', 'atk', -1, 'foe'), statMove('swords-dance', 'atk', 2, 'self', null)]);
    const b = member('foe', ['normal'], base(), [statMove('splash', 'atk', 0, 'self', null)]);
    const battle = createBattle([a], [b], 1);
    const growl = battle.playMove('A', 'growl');
    expect(kinds(growl)).toEqual(['useMove', 'stat']);
    expect(growl[1]).toEqual({ kind: 'stat', side: 'B', index: 0, stat: 'atk', change: -1, applied: -1 });
    expect(battle.stages('B', 0).atk).toBe(-1);
    battle.playMove('B', 'splash');
    for (let i = 0; i < 3; i++) {
      expect(battle.playMove('A', 'swords-dance')[1]).toEqual({ kind: 'stat', side: 'A', index: 0, stat: 'atk', change: 2, applied: 2 });
      battle.playMove('B', 'splash');
    }
    expect(battle.playMove('A', 'swords-dance')[1]).toMatchObject({ side: 'A', applied: 0 });
    expect(battle.stages('A', 0).atk).toBe(6);
  });

  it('never deals damage with a status move', () => {
    const a = fastA([statMove('growl', 'atk', -1, 'foe')]);
    const events = createBattle([a], [sturdy()], 1).playMove('A', 'growl');
    expect(events.some(e => e.kind === 'damage')).toBe(false);
  });

  it('speed stages change later turn order', () => {
    const slow = member('slow', ['normal'], base({ spe: 60 }), [statMove('agility', 'spe', 2, 'self', null)]);
    const fast = member('fast', ['normal'], base({ spe: 80 }), [statMove('splash', 'atk', 0, 'self', null)]);
    const battle = createBattle([slow], [fast], 1);
    battle.playMove('A', 'agility');
    battle.playMove('B', 'splash');
    expect(battle.turn).toBe(2);
    expect(battle.nextSide).toBe('A');
  });

  it('switching uses the turn and resets stages', () => {
    const a1 = fastA([statMove('swords-dance', 'atk', 2, 'self', null)]);
    const a2 = member('bench', ['normal'], base({ spe: 200 }), [move('tackle', 'normal', 10)]);
    const battle = createBattle([a1, a2], [sturdy()], 1);
    battle.playMove('A', 'swords-dance');
    battle.playMove('B', 'tackle');
    expect(battle.stages('A', 0).atk).toBe(2);
    expect(battle.switchTo('B', 0)).toEqual([]);
    expect(battle.switchTo('A', 0)).toEqual([]); // already active
    const events = battle.switchTo('A', 1);
    expect(events).toEqual([
      { kind: 'withdraw', side: 'A', index: 0 },
      { kind: 'switchIn', side: 'A', index: 1, hp: expect.any(Number), maxHp: expect.any(Number) },
    ]);
    expect(battle.nextSide).toBe('B');
    battle.playMove('B', 'tackle');
    expect(battle.switchTo('A', 0)[1]).toMatchObject({ kind: 'switchIn', index: 0 });
    expect(battle.stages('A', 0).atk).toBe(0);
  });

  it('waits for a replacement before the next action', () => {
    const battle = createBattle([strongFast], [weakSlow('one'), weakSlow('two'), weakSlow('three')], 5);
    battle.playMove('A', 'mega-punch');
    expect(battle.replacing).toBe('B');
    expect(battle.nextSide).toBeNull();
    expect(battle.ended).toBe(false);
    expect(battle.playMove('A', 'mega-punch')).toEqual([]);
    expect(battle.replace('A', 0)).toEqual([]);
    expect(battle.replace('B', 0)).toEqual([]); // fainted
    expect(battle.replace('B', 2)).toEqual([{ kind: 'switchIn', side: 'B', index: 2, hp: expect.any(Number), maxHp: expect.any(Number) }]);
    expect(battle.replacing).toBeNull();
    expect(battle.turn).toBe(2);
    expect(battle.nextSide).toBe('A');
  });

  it('simulate replaces fainted Pokémon and finishes when stat moves run out of PP', () => {
    const a = [member('dancer', ['normal'], base(), [{ ...statMove('swords-dance', 'atk', 2, 'self', null), pp: 3 }])];
    const b = [weakSlow('w1'), weakSlow('w2')];
    const events = simulate(a, b, 2);
    expect(kinds(events)).toContain('recoil');
    expect(events.at(-1)).toMatchObject({ kind: 'end', winner: 'A', reason: 'knockout' });
  });

  it('defaults missing PP to 5', () => {
    const old = { ...move('tackle', 'normal', 10), pp: undefined } as unknown as Move;
    const battle = createBattle([fastA([old])], [sturdy()], 1);
    expect(battle.ppLeft('A', 0)).toEqual([5]);
  });
});

describe('simulate', () => {
  it('starts with both switch-ins and ends with an end event', () => {
    const events = simulate([strongFast], [weakSlow('w1')], 1);
    expect(events[0]).toMatchObject({ kind: 'switchIn', side: 'A', index: 0 });
    expect(events[1]).toMatchObject({ kind: 'switchIn', side: 'B', index: 0 });
    expect(events.at(-1)).toMatchObject({ kind: 'end', winner: 'A', reason: 'knockout' });
  });

  it('gives the player the opening move, then lets the faster Pokémon act first', () => {
    const slow = member('slow', ['normal'], base({ spe: 10 }), [move('tackle', 'normal', 10)]);
    const fast = member('fast', ['normal'], base({ spe: 200 }), [move('tackle', 'normal', 10)]);
    const battle = createBattle([slow], [fast], 1);
    expect(battle.nextSide).toBe('A');
    battle.playMove('A', 'tackle');
    battle.playMove('B', 'tackle');
    expect(battle.turn).toBe(2);
    expect(battle.nextSide).toBe('B');
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
    // Enough PP that nobody falls back to (typeless) Struggle.
    const a = [member('norm', ['normal'], base(), [{ ...move('tackle', 'normal', 40), pp: TURN_CAP }])];
    const b = [member('spook', ['ghost'], base(), [{ ...move('lick', 'ghost', 30), pp: TURN_CAP }])];
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

describe('mega evolution', () => {
  const tackle = move('tackle', 'normal', 40);
  const dragonClaw = move('dragon-claw', 'dragon', 80);
  const megaMember = (name: string, stats: StatBlock, megaStats: StatBlock, moves: Move[] = [tackle]): TeamMember => {
    const m = member(name, ['fire'], stats, moves);
    return { ...m, pokemon: { ...m.pokemon, megas: [
      { name: `${name}-mega-x`, types: ['fire', 'dragon'], baseStats: megaStats, sprites: { front: null, back: null, artwork: null } },
      { name: `${name}-mega-y`, types: ['fire', 'flying'], baseStats: megaStats, sprites: { front: null, back: null, artwork: null } },
    ] } };
  };
  const foe = () => member('foe', ['normal'], base({ hp: 255, def: 80, spe: 10 }), [tackle]);
  const firstDamage = (events: BattleEvent[]) => events.find(e => e.kind === 'damage') as Extract<BattleEvent, { kind: 'damage' }>;

  it('Mega Evolves before the move, keeps HP and hits harder with the Mega stats', () => {
    const normal = megaMember('zard', base({ atk: 80 }), base({ atk: 200 }));
    const plain = createBattle([normal], [foe()], 7).playMove('A', 'tackle');
    const battle = createBattle([normal], [foe()], 7);
    const events = battle.playMove('A', 'tackle', 'zard-mega-x');
    expect(kinds(events).slice(0, 2)).toEqual(['mega', 'useMove']);
    expect(events[0]).toEqual({ kind: 'mega', side: 'A', index: 0, form: 'zard-mega-x' });
    expect(battle.form('A', 0)).toBe('zard-mega-x');
    expect(firstDamage(events).amount).toBeGreaterThan(firstDamage(plain).amount);
    // HP is untouched by the change.
    expect(events.some(e => e.kind === 'damage' && e.side === 'A')).toBe(false);
  });

  it('takes the Mega types for same-type attack bonus', () => {
    const stats = base();
    const plain = createBattle([megaMember('zard', stats, stats, [dragonClaw])], [foe()], 3).playMove('A', 'dragon-claw');
    const mega = createBattle([megaMember('zard', stats, stats, [dragonClaw])], [foe()], 3).playMove('A', 'dragon-claw', 'zard-mega-x');
    expect(firstDamage(mega).amount).toBeGreaterThan(firstDamage(plain).amount); // Dragon STAB after becoming Fire/Dragon
  });

  it('uses the Mega Speed from the next round', () => {
    const fast = member('fast', ['normal'], base({ hp: 255, spe: 100 }), [move('tap', 'normal', 1)]);
    const slow = megaMember('slow', base({ hp: 255, spe: 50 }), base({ hp: 255, spe: 200 }), [move('tap', 'normal', 1)]);
    const battle = createBattle([fast], [slow], 2);
    battle.playMove('A', 'tap');
    battle.playMove('B', 'tap', 'slow-mega-y');
    expect(battle.turn).toBe(2);
    expect(battle.nextSide).toBe('B');
  });

  it('rejects an unknown form, a Pokémon without Megas and a second Mega Evolution, without using PP', () => {
    const battle = createBattle([megaMember('zard', base({ hp: 255 }), base({ hp: 255 }))], [member('plain', ['normal'], base({ hp: 255 }), [tackle])], 4);
    expect(battle.playMove('A', 'tackle', 'nope-mega')).toEqual([]);
    expect(battle.ppLeft('A', 0)).toEqual([10]);
    battle.playMove('A', 'tackle', 'zard-mega-x');
    expect(battle.playMove('B', 'tackle', 'plain-mega')).toEqual([]);
    battle.playMove('B', 'tackle');
    expect(battle.playMove('A', 'tackle', 'zard-mega-y')).toEqual([]);
    expect(battle.playMove('A', 'tackle').length).toBeGreaterThan(0);
    expect(battle.form('A', 0)).toBe('zard-mega-x');
  });

  it('lets every eligible Pokémon on a team Mega Evolve', () => {
    const frail = megaMember('two', base({ hp: 20, def: 10, spe: 10 }), base({ hp: 20, def: 10, spe: 10 }));
    const sturdy = megaMember('three', base({ hp: 255, def: 255, spe: 10 }), base({ hp: 255, def: 255, spe: 10 }));
    const hitter = member('hitter', ['normal'], base({ atk: 120, spe: 200 }), [move('slam', 'normal', 60)]);
    const battle = createBattle([frail, sturdy], [hitter], 9);
    battle.playMove('A', 'tackle', 'two-mega-x');
    battle.playMove('B', 'slam');
    expect(battle.replacing).toBe('A'); // the first Mega fainted
    battle.replace('A', 1);
    battle.playMove('B', 'slam'); // faster, so it opens round two
    expect(battle.playMove('A', 'tackle', 'three-mega-y')[0]).toMatchObject({ kind: 'mega', index: 1 });
    expect([battle.form('A', 0), battle.form('A', 1)]).toEqual(['two-mega-x', 'three-mega-y']);
  });
});
