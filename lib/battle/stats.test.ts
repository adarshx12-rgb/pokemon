import { describe, it, expect } from 'vitest';
import { statsAtLevel50 } from './stats';

describe('statsAtLevel50', () => {
  it('matches level-50 Charizard (IV 31, EV 0, neutral)', () => {
    expect(statsAtLevel50({ hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }))
      .toEqual({ hp: 153, atk: 104, def: 98, spa: 129, spd: 105, spe: 120 });
  });
});
