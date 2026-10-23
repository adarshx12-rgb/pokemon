import { describe, it, expect } from 'vitest';
import { normalizeMove, normalizePokemon, levelUpLevels, pixelSprites } from './normalize';
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
    expect(normalizeMove(rawMove('flamethrower', 'fire', 90, 'special'))).toEqual({ name: 'flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special', pp: 5 });
  });
  it('drops powerless moves and unknown types', () => {
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
    expect(p.sprites).toEqual({ front: expect.stringContaining('heartgold-soulsilver/6.png'), back: expect.stringContaining('back/6.png'), artwork: 'art.png' });
    expect(normalizePokemon({ ...raw, id: 700 }, []).sprites).toEqual({ front: 'sd-front.gif', back: 'back.png', artwork: 'art.png' });
    expect(p.movePool.map(m => m.name)).toEqual(['flamethrower']);
  });
});

const statMove = (name: string, pp: number, target: string, category: string | null, changes: [number, string][]): RawMove => ({
  name, power: null, accuracy: 100, type: { name: 'normal' }, damage_class: { name: 'status' }, pp,
  target: { name: target }, meta: category ? { category: { name: category } } : null,
  stat_changes: changes.map(([change, stat]) => ({ change, stat: { name: stat } })),
});

describe('stat moves', () => {
  it('keeps pure stat moves with pp, target and stat changes', () => {
    expect(normalizeMove(statMove('growl', 40, 'all-opponents', 'net-good-stats', [[-1, 'attack']]))).toEqual({
      name: 'growl', type: 'normal', power: 0, accuracy: 100, damageClass: 'status', pp: 40, target: 'foe',
      statChanges: [{ stat: 'atk', change: -1 }],
    });
    const sd = normalizeMove(statMove('swords-dance', 20, 'user', 'net-good-stats', [[2, 'attack']]));
    expect(sd?.target).toBe('self');
  });
  it('sends user-targeted variants to self and drops moves the engine cannot place', () => {
    for (const t of ['user', 'user-and-allies', 'user-or-ally'])
      expect(normalizeMove(statMove('howl', 40, t, 'net-good-stats', [[1, 'attack']]))?.target).toBe('self');
    expect(normalizeMove(statMove('aromatic-mist', 20, 'ally', 'net-good-stats', [[1, 'special-defense']]))).toBeNull();
    expect(normalizeMove(statMove('rototiller', 10, 'all-pokemon', 'net-good-stats', [[1, 'attack']]))).toBeNull();
    for (const n of ['decorate', 'parting-shot', 'clangorous-soul', 'no-retreat', 'stuff-cheeks', 'geomancy', 'venom-drench', 'captivate'])
      expect(normalizeMove(statMove(n, 10, 'user', 'net-good-stats', [[1, 'attack']]))).toBeNull();
  });
  it('drops status moves that do more than change stats', () => {
    expect(normalizeMove(statMove('thunder-wave', 20, 'selected-pokemon', 'ailment', []))).toBeNull();
    expect(normalizeMove(statMove('odd', 20, 'user', null, [[1, 'attack']]))).toBeNull();
  });
});

describe('levelUpLevels', () => {
  const entry = (name: string, vg: string, level: number, method = 'level-up'): RawPokemon['moves'][number] => ({
    move: { name, url: '' },
    version_group_details: [{ move_learn_method: { name: method }, version_group: { name: vg }, level_learned_at: level }],
  });
  it('prefers HGSS level-up levels, then the newest version group', () => {
    const both = { ...raw, moves: [entry('ember', 'heartgold-soulsilver', 10), entry('ember', 'scarlet-violet', 7)] };
    expect(levelUpLevels(both).get('ember')).toBe(10);
    const svOnly = { ...raw, moves: [entry('ember', 'scarlet-violet', 7), entry('ember', 'sword-shield', 9)] };
    expect(levelUpLevels(svOnly).get('ember')).toBe(7);
    const zero = { ...raw, moves: [entry('tackle', 'heartgold-soulsilver', 0), entry('x', 'heartgold-soulsilver', 5, 'machine')] };
    expect(levelUpLevels(zero).get('tackle')).toBe(1);
    expect(levelUpLevels(zero).has('x')).toBe(false);
  });
});

describe('pixelSprites', () => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions';
  it('uses HGSS, then BW pixel sprites', () => {
    expect(pixelSprites(6)).toEqual({
      front: `${base}/generation-iv/heartgold-soulsilver/6.png`,
      back: `${base}/generation-iv/heartgold-soulsilver/back/6.png`,
    });
    expect(pixelSprites(500)).toEqual({
      front: `${base}/generation-v/black-white/500.png`,
      back: `${base}/generation-v/black-white/back/500.png`,
    });
    expect(pixelSprites(700)).toEqual({ front: null, back: null });
  });
  it('is used by normalizePokemon, keeping Showdown sprites past gen 5', () => {
    expect(normalizePokemon(raw, []).sprites.front).toContain('heartgold-soulsilver/6.png');
    expect(normalizePokemon({ ...raw, id: 700 }, []).sprites.front).toBe('sd-front.gif');
  });
});
