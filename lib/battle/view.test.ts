import { describe, it, expect } from 'vitest';
import { applyEvent, initView, moveLabel, teamNames, hpColor, type BattleView } from './view';
import type { BattleEvent, TeamMember } from './types';

const mon = (name: string): TeamMember => ({
  pokemon: { id: 1, name, types: ['normal'], baseStats: { hp: 78, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
    sprites: { front: null, back: null, artwork: null }, movePool: [] },
  moves: [],
});
const A = [mon('charizard'), mon('mr-mime')];
const B = [mon('azumarill')];
const names = teamNames(A, B);
const run = (events: BattleEvent[], v: BattleView = initView(A, B)) => events.reduce((s, e) => applyEvent(s, e, names), v);
const flamethrower = { name: 'flamethrower', type: 'fire' as const, power: 90, accuracy: 100, damageClass: 'special' as const, pp: 10 };

describe('battle view', () => {
  it('starts at full HP with nobody active', () => {
    const v = initView(A, B);
    expect(v.hp.A).toEqual([153, 153]);
    expect(v.active).toEqual({ A: null, B: null });
    expect(v.message).toBe('');
  });

  it('uppercases names and formats move labels', () => {
    expect(names.A).toEqual(['CHARIZARD', 'MR MIME']);
    expect(moveLabel('fire-blast')).toBe('FIRE BLAST');
  });

  it('writes switch-in messages for both sides', () => {
    const v = run([{ kind: 'switchIn', side: 'A', index: 0, hp: 153, maxHp: 153 }]);
    expect(v.active.A).toBe(0);
    expect(v.message).toBe('Go! CHARIZARD!');
    const w = applyEvent(v, { kind: 'switchIn', side: 'B', index: 0, hp: 153, maxHp: 153 }, names);
    expect(w.message).toBe('RIVAL sent out AZUMARILL!');
  });

  it('prefixes foe moves', () => {
    const v = run([{ kind: 'useMove', side: 'B', index: 0, move: flamethrower, ppLeft: 14 }]);
    expect(v.message).toBe("The foe's AZUMARILL used FLAMETHROWER!");
  });

  it('updates HP and adds effectiveness text', () => {
    const v = run([{ kind: 'damage', side: 'B', index: 0, amount: 50, hpAfter: 103, effectiveness: 2, crit: true }]);
    expect(v.hp.B[0]).toBe(103);
    expect(v.message).toBe("A critical hit! It's super effective!");
  });

  it('keeps the previous message (and id) for plain neutral damage', () => {
    const before = run([{ kind: 'useMove', side: 'A', index: 0, move: flamethrower, ppLeft: 14 }]);
    const after = applyEvent(before, { kind: 'damage', side: 'B', index: 0, amount: 10, hpAfter: 143, effectiveness: 1, crit: false }, names);
    expect(after.message).toBe('CHARIZARD used FLAMETHROWER!');
    expect(after.messageId).toBe(before.messageId);
  });

  it('describes immunity, misses, faints, and the end', () => {
    expect(run([{ kind: 'damage', side: 'B', index: 0, amount: 0, hpAfter: 153, effectiveness: 0, crit: false }]).message)
      .toBe("It doesn't affect the foe's AZUMARILL…");
    expect(run([{ kind: 'miss', side: 'A', index: 1 }]).message).toBe("MR MIME's attack missed!");
    const fainted = run([{ kind: 'faint', side: 'B', index: 0 }]);
    expect(fainted.fainted.B[0]).toBe(true);
    expect(fainted.message).toBe("The foe's AZUMARILL fainted!");
    const end = run([{ kind: 'end', winner: 'A', reason: 'knockout', damageDealt: { A: [0, 0], B: [0] } }]);
    expect(end.winner).toBe('A');
    expect(end.message).toBe('You won the battle!');
  });

  it('writes stat, recoil and withdraw messages', () => {
    const stat = (side: 'A' | 'B', change: number, applied: number) =>
      run([{ kind: 'stat', side, index: 0, stat: 'atk', change, applied }]).message;
    expect(stat('A', 1, 1)).toBe("CHARIZARD's ATTACK rose!");
    expect(stat('A', 2, 2)).toBe("CHARIZARD's ATTACK sharply rose!");
    expect(stat('A', 2, 0)).toBe("CHARIZARD's ATTACK won't go any higher!");
    expect(stat('B', -1, -1)).toBe("The foe's AZUMARILL's ATTACK fell!");
    expect(stat('A', -2, -2)).toBe("CHARIZARD's ATTACK harshly fell!");
    expect(stat('A', -1, 0)).toBe("CHARIZARD's ATTACK won't go any lower!");
    expect(run([{ kind: 'stat', side: 'A', index: 0, stat: 'spa', change: 1, applied: 1 }]).message).toBe("CHARIZARD's SP. ATK rose!");
    const r = run([{ kind: 'recoil', side: 'A', index: 0, amount: 10, hpAfter: 143 }]);
    expect(r.hp.A[0]).toBe(143);
    expect(r.message).toBe('CHARIZARD is hit with recoil!');
    expect(run([{ kind: 'withdraw', side: 'A', index: 0 }]).message).toBe('CHARIZARD, come back!');
    expect(run([{ kind: 'withdraw', side: 'B', index: 0 }]).message).toBe('RIVAL withdrew AZUMARILL!');
  });

  it('tracks pp and stages, resetting stages on a switch', () => {
    const withPp = [{ ...mon('charizard'), moves: [flamethrower, { ...flamethrower, name: 'ember', pp: undefined as never }] }, mon('mr-mime')];
    const v0 = initView(withPp, B);
    expect(v0.pp.A[0]).toEqual([10, 5]);
    expect(v0.stages.A[0].atk).toBe(0);
    const v1 = [{ kind: 'useMove', side: 'A', index: 0, move: flamethrower, ppLeft: 9 } as BattleEvent,
      { kind: 'stat', side: 'A', index: 0, stat: 'atk', change: 2, applied: 2 } as BattleEvent]
      .reduce((s, e) => applyEvent(s, e, teamNames(withPp, B)), v0);
    expect(v1.pp.A[0]).toEqual([9, 5]);
    expect(v1.stages.A[0].atk).toBe(2);
    const struggle = applyEvent(v1, { kind: 'useMove', side: 'A', index: 0, move: { ...flamethrower, name: 'struggle' }, ppLeft: 0 }, teamNames(withPp, B));
    expect(struggle.pp.A[0]).toEqual([9, 5]);
    const v2 = applyEvent(applyEvent(v1, { kind: 'withdraw', side: 'A', index: 0 }, teamNames(withPp, B)),
      { kind: 'switchIn', side: 'A', index: 1, hp: 153, maxHp: 153 }, teamNames(withPp, B));
    expect(v2.stages.A[0].atk).toBe(0);
  });

  it('colours HP', () => {
    expect(hpColor(51, 100)).toBe('green');
    expect(hpColor(50, 100)).toBe('yellow');
    expect(hpColor(21, 100)).toBe('yellow');
    expect(hpColor(20, 100)).toBe('red');
  });
});
