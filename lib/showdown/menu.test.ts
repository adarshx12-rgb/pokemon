import { describe, expect, it } from 'vitest';
import { STRUGGLE } from '@/lib/battle/moves';
import type { Move } from '@/lib/battle/types';
import { fightOptions, menuFor } from './menu';

const move = (name: string, pp = 10): Move => ({ name, type: 'normal', power: 40, accuracy: 100, damageClass: 'physical', pp });

describe('menuFor', () => {
  it('opens the replacement picker after a faint', () => {
    expect(menuFor({ replacing: true, layout: 'ds' })).toBe('replace');
    expect(menuFor({ replacing: true, layout: 'side' })).toBe('replace');
  });
  it('keeps the Fight menu open in side layout and starts at main in ds layout', () => {
    expect(menuFor({ replacing: false, layout: 'side' })).toBe('fight');
    expect(menuFor({ replacing: false, layout: 'ds' })).toBe('main');
  });
});

describe('fightOptions', () => {
  const moves = [move('tackle'), move('growl'), move('bite')];
  it('pairs each move with its PP', () => {
    expect(fightOptions(moves, [5, 3, 1]).map(o => [o.move.name, o.pp, o.disabled])).toEqual([['tackle', 5, false], ['growl', 3, false], ['bite', 1, false]]);
  });
  it('disables a move with no PP left', () => {
    expect(fightOptions(moves, [5, 0, 1]).map(o => o.disabled)).toEqual([false, true, false]);
  });
  it('offers only Struggle when every move is out of PP', () => {
    expect(fightOptions(moves, [0, 0, 0])).toEqual([{ move: STRUGGLE, pp: 1, disabled: false }]);
  });
  it('offers only Struggle when there are no moves', () => {
    expect(fightOptions([], [])).toEqual([{ move: STRUGGLE, pp: 1, disabled: false }]);
  });
});
