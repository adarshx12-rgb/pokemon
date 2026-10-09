import { describe, it, expect } from 'vitest';
import { normalizeMove, normalizePokemon } from './normalize';
import type { RawMove, RawPokemon } from './normalize';

const rawMove = (name: string, type: string, power: number | null, cls: string, accuracy: number | null = 100): RawMove =>
  ({ name, power, accuracy, type: { name: type }, damage_class: { name: cls } });

const raw: RawPokemon = {
  id: 6, name: 'charizard',
  types: [{ slot: 2, type: { name: 'flying' } }, { slot: 1, type: { name: 'fire' } }],
  stats: [
    { base_stat: 78, stat: { name: 'hp' } }, { base_stat: 84, stat: { name: 'attack' } },
    { base_stat: 78, stat: { name: 'defense' } }, { base_stat: 109, stat: { name: 'special-attack' } },
    { base_stat: 85, stat: { name: 'special-defense' } }, { base_stat: 100, stat: { name: 'speed' } },
  ],
  moves: [],
  sprites: {
    front_default: 'front.png', back_default: 'back.png',
    other: { showdown: { front_default: 'sd-front.gif', back_default: null }, 'official-artwork': { front_default: 'art.png' } },
  },
};

describe('normalizeMove', () => {
  it('keeps damaging moves', () => {
    expect(normalizeMove(rawMove('flamethrower', 'fire', 90, 'special'))).toEqual({ name: 'flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' });
  });
  it('drops status moves, powerless moves, and unknown types', () => {
    expect(normalizeMove(rawMove('swords-dance', 'normal', null, 'status'))).toBeNull();
    expect(normalizeMove(rawMove('counter', 'fighting', null, 'physical'))).toBeNull();
    expect(normalizeMove(rawMove('tera-blast', 'stellar', 80, 'special'))).toBeNull();
  });
});

describe('normalizeMove exclusions', () => {
  it.each(['explosion', 'self-destruct', 'hyper-beam', 'giga-impact', 'blast-burn', 'focus-punch', 'dream-eater', 'solar-beam', 'fake-out', 'future-sight'])('drops %s (its drawback is not simulated)', name => {
    expect(normalizeMove(rawMove(name, 'normal', 150, 'physical'))).toBeNull();
  });
});

describe('normalizePokemon', () => {
  it('maps stats, slot-ordered types, sprites with fallbacks, and a deduped move pool', () => {
    const p = normalizePokemon(raw, [rawMove('flamethrower', 'fire', 90, 'special'), rawMove('flamethrower', 'fire', 90, 'special'), rawMove('roost', 'flying', null, 'status')]);
    expect(p.types).toEqual(['fire', 'flying']);
    expect(p.baseStats).toEqual({ hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 });
    expect(p.sprites).toEqual({ front: 'sd-front.gif', back: 'back.png', artwork: 'art.png' });
    expect(p.movePool.map(m => m.name)).toEqual(['flamethrower']);
  });
});
