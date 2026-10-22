import { afterEach, describe, expect, it, vi } from 'vitest';
import { initView, type BattleView } from '@/lib/battle/view';
import type { BattleEvent, Move, TeamMember } from '@/lib/battle/types';
import { battleCue, crossesLowHp, eventCues, setCueHandler } from './cues';

afterEach(() => setCueHandler(null));

describe('battleCue', () => {
  it('does nothing without a handler', () => {
    expect(() => battleCue('hit')).not.toThrow();
  });
  it('calls the handler with the cue and detail', () => {
    const handler = vi.fn();
    setCueHandler(handler);
    battleCue('moveUse', { pokemon: 'pikachu', type: 'electric' });
    expect(handler).toHaveBeenCalledWith('moveUse', { pokemon: 'pikachu', type: 'electric' });
  });
  it('stops calling a cleared handler', () => {
    const handler = vi.fn();
    setCueHandler(handler);
    setCueHandler(null);
    battleCue('faint');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('crossesLowHp', () => {
  it('fires only when HP first drops to 20% or below while still standing', () => {
    expect(crossesLowHp(100, 20, 100)).toBe(true);
    expect(crossesLowHp(21, 15, 100)).toBe(true);
    expect(crossesLowHp(20, 10, 100)).toBe(false); // already low
    expect(crossesLowHp(100, 21, 100)).toBe(false);
    expect(crossesLowHp(100, 0, 100)).toBe(false); // fainted instead
  });
});

const move = (over: Partial<Move> = {}): Move => ({ name: 'tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical', pp: 35, ...over });
const member = (name: string): TeamMember => ({
  pokemon: { id: 1, name, types: ['normal'], baseStats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 }, sprites: { front: null, back: null, artwork: null }, movePool: [] },
  moves: [move()],
});

describe('eventCues', () => {
  const view: BattleView = initView([member('pikachu')], [member('eevee')]);
  const species = { A: ['pikachu'], B: ['eevee'] };
  const max = view.maxHp.B[0];
  const cues = (event: BattleEvent, v = view) => eventCues(event, v, species).map(c => c.cue);

  it('cues the move with its type', () => {
    expect(eventCues({ kind: 'useMove', side: 'A', index: 0, move: move({ type: 'fire' }), ppLeft: 1 }, view, species))
      .toEqual([{ cue: 'moveUse', detail: { pokemon: 'pikachu', type: 'fire' } }]);
  });
  it('cues hits with their effectiveness and crits', () => {
    const hit = (over: Partial<Extract<BattleEvent, { kind: 'damage' }>>): BattleEvent => ({ kind: 'damage', side: 'B', index: 0, amount: 5, hpAfter: max - 5, effectiveness: 1, crit: false, ...over });
    expect(cues(hit({}))).toEqual(['hit']);
    expect(cues(hit({ crit: true, effectiveness: 2 }))).toEqual(['hit', 'crit', 'superEffective']);
    expect(cues(hit({ effectiveness: 0.5 }))).toEqual(['hit', 'notVeryEffective']);
    expect(cues(hit({ amount: 0, hpAfter: max, effectiveness: 0 }))).toEqual([]);
  });
  it('cues low HP once, on the hit that crosses 20%', () => {
    const low = Math.floor(max * 0.2);
    const event: BattleEvent = { kind: 'damage', side: 'B', index: 0, amount: max - low, hpAfter: low, effectiveness: 1, crit: false };
    expect(cues(event)).toEqual(['hit', 'lowHp']);
    const already = { ...view, hp: { ...view.hp, B: [low] } };
    expect(cues({ ...event, amount: 1, hpAfter: low - 1 }, already)).toEqual(['hit']);
    expect(cues({ kind: 'recoil', side: 'B', index: 0, amount: max - low, hpAfter: low })).toEqual(['hit', 'lowHp']);
  });
  it('cues stat changes, faints and the result', () => {
    expect(cues({ kind: 'stat', side: 'A', index: 0, stat: 'atk', change: 2, applied: 2 })).toEqual(['statUp']);
    expect(cues({ kind: 'stat', side: 'B', index: 0, stat: 'def', change: -1, applied: -1 })).toEqual(['statDown']);
    expect(cues({ kind: 'stat', side: 'B', index: 0, stat: 'def', change: -1, applied: 0 })).toEqual([]);
    expect(cues({ kind: 'faint', side: 'B', index: 0 })).toEqual(['faint']);
    const damageDealt = { A: [0], B: [0] };
    expect(cues({ kind: 'end', winner: 'A', reason: 'knockout', damageDealt })).toEqual(['victory']);
    expect(cues({ kind: 'end', winner: 'B', reason: 'knockout', damageDealt })).toEqual(['defeat']);
  });
});
