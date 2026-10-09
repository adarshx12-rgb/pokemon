import { describe, it, expect } from 'vitest';
import { applyEvent, initView, moveLabel, teamNames, type BattleView } from './view';
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
const flamethrower = { name: 'flamethrower', type: 'fire' as const, power: 90, accuracy: 100, damageClass: 'special' as const };

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
    expect(w.message).toBe('Enemy sent out AZUMARILL!');
  });

  it('prefixes enemy moves with "Enemy"', () => {
    const v = run([{ kind: 'useMove', side: 'B', index: 0, move: flamethrower }]);
    expect(v.message).toBe('Enemy AZUMARILL used FLAMETHROWER!');
  });

  it('updates HP and adds effectiveness text', () => {
    const v = run([{ kind: 'damage', side: 'B', index: 0, amount: 50, hpAfter: 103, effectiveness: 2, crit: true }]);
    expect(v.hp.B[0]).toBe(103);
    expect(v.message).toBe("A critical hit! It's super effective!");
  });

  it('keeps the previous message (and id) for plain neutral damage', () => {
    const before = run([{ kind: 'useMove', side: 'A', index: 0, move: flamethrower }]);
    const after = applyEvent(before, { kind: 'damage', side: 'B', index: 0, amount: 10, hpAfter: 143, effectiveness: 1, crit: false }, names);
    expect(after.message).toBe('CHARIZARD used FLAMETHROWER!');
    expect(after.messageId).toBe(before.messageId);
  });

  it('describes immunity, misses, faints, and the end', () => {
    expect(run([{ kind: 'damage', side: 'B', index: 0, amount: 0, hpAfter: 153, effectiveness: 0, crit: false }]).message)
      .toBe("It doesn't affect Enemy AZUMARILL…");
    expect(run([{ kind: 'miss', side: 'A', index: 1 }]).message).toBe("MR MIME's attack missed!");
    const fainted = run([{ kind: 'faint', side: 'B', index: 0 }]);
    expect(fainted.fainted.B[0]).toBe(true);
    expect(fainted.message).toBe('Enemy AZUMARILL fainted!');
    const end = run([{ kind: 'end', winner: 'A', reason: 'knockout', damageDealt: { A: [0, 0], B: [0] } }]);
    expect(end.winner).toBe('A');
    expect(end.message).toBe('You won the battle!');
  });
});
