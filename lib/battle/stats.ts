import type { StatBlock } from './types';

const IV = 31;
const LEVEL = 50;

const core = (base: number) => Math.floor(((2 * base + IV) * LEVEL) / 100);

export function statsAtLevel50(base: StatBlock): StatBlock {
  return {
    hp: core(base.hp) + LEVEL + 10,
    atk: core(base.atk) + 5,
    def: core(base.def) + 5,
    spa: core(base.spa) + 5,
    spd: core(base.spd) + 5,
    spe: core(base.spe) + 5,
  };
}
