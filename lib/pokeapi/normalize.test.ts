import { describe, it, expect } from 'vitest';
import { normalizeMove, normalizePokemon } from './normalize';
import type { RawMove, RawPokemon } from './normalize';

const rawMove = (name: string, type: string, power: number | null, cls: string, accuracy: number | null = 100): RawMove =>
  ({ name, power, accuracy, type: { name: type }, damage_class: { name: cls } });
const learned = (name: string, method = 'level-up'): RawPokemon['moves'][number] => ({
  move: { name, url: `https://pokeapi.co/api/v2/move/${name}/` },
  version_group_details: [{ move_learn_method: { name: method }, version_group: { name: 'scarlet-violet' }, level_learned_at: 1 }],
});

const raw: RawPokemon = {
  id: 6, name: 'charizard',
  types: [{ slot: 2, type: { name: 'flying' } }, { slot: 1, type: { name: 'fire' } }],
  stats: [
    { base_stat: 78, stat: { name: 'hp' } }, { base_stat: 84, stat: { name: 'attack' } },
    { base_stat: 78, stat: { name: 'defense' } }, { base_stat: 109, stat: { name: 'special-attack' } },
    { base_stat: 85, stat: { name: 'special-defense' } }, { base_stat: 100, stat: { name: 'speed' } },
  ],
  moves: [learned('flamethrower'), learned('roost', 'machine')],
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
  it('keeps only attacks this species is recorded as learning, even if unrelated definitions are supplied', () => {
    const blastoise: RawPokemon = { ...raw, id: 9, name: 'blastoise', moves: [learned('hydro-pump'), learned('ice-beam', 'machine')] };
    const p = normalizePokemon(blastoise, [
      rawMove('hydro-pump', 'water', 110, 'special'),
      rawMove('ice-beam', 'ice', 90, 'special'),
      rawMove('thunderbolt', 'electric', 90, 'special'),
      rawMove('flamethrower', 'fire', 90, 'special'),
    ]);
    expect(p.movePool.map(move => move.name)).toEqual(['hydro-pump', 'ice-beam']);
    expect(p.movePool[0].learnMethods).toEqual(['level-up']);
    expect(p.movePool[1].learnMethods).toEqual(['machine']);
  });
  it('does not admit a move with no recorded learning method', () => {
    const p = normalizePokemon({ ...raw, moves: [{ ...learned('thunderbolt'), version_group_details: [] }] }, [rawMove('thunderbolt', 'electric', 90, 'special')]);
    expect(p.movePool).toEqual([]);
  });
  it('maps stats, slot-ordered types, sprites with fallbacks, and a deduped move pool', () => {
    const p = normalizePokemon(raw, [rawMove('flamethrower', 'fire', 90, 'special'), rawMove('flamethrower', 'fire', 90, 'special'), rawMove('roost', 'flying', null, 'status')]);
    expect(p.types).toEqual(['fire', 'flying']);
    expect(p.baseStats).toEqual({ hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 });
    expect(p.sprites).toEqual({ front: 'sd-front.gif', back: 'back.png', artwork: 'art.png' });
    expect(p.movePool.map(m => m.name)).toEqual(['flamethrower']);
  });
});
