import { TYPE_NAMES, type BattlePokemon, type Move, type StatBlock, type TypeName } from '@/lib/battle/types';

export interface RawMove {
  name: string;
  power: number | null;
  accuracy: number | null;
  type: { name: string };
  damage_class: { name: string };
}

export interface RawPokemon {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  moves: { move: { name: string; url: string } }[];
  sprites: {
    front_default: string | null;
    back_default: string | null;
    other?: {
      showdown?: { front_default: string | null; back_default: string | null };
      'official-artwork'?: { front_default: string | null };
    };
  };
}

const isType = (t: string): t is TypeName => (TYPE_NAMES as readonly string[]).includes(t);

const STAT_KEYS: Record<string, keyof StatBlock> = {
  hp: 'hp', attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd', speed: 'spe',
};

export function normalizeMove(raw: RawMove): Move | null {
  const cls = raw.damage_class.name;
  if (cls !== 'physical' && cls !== 'special') return null;
  if (!raw.power || raw.power <= 0) return null;
  if (!isType(raw.type.name)) return null;
  return { name: raw.name, type: raw.type.name, power: raw.power, accuracy: raw.accuracy, damageClass: cls };
}

export function normalizePokemon(raw: RawPokemon, moves: RawMove[]): BattlePokemon {
  const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const s of raw.stats) {
    const key = STAT_KEYS[s.stat.name];
    if (key) baseStats[key] = s.base_stat;
  }
  const types = [...raw.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name).filter(isType);
  const seen = new Set<string>();
  const movePool: Move[] = [];
  for (const m of moves) {
    const move = normalizeMove(m);
    if (move && !seen.has(move.name)) { seen.add(move.name); movePool.push(move); }
  }
  const sd = raw.sprites.other?.showdown;
  const art = raw.sprites.other?.['official-artwork']?.front_default ?? null;
  return {
    id: raw.id,
    name: raw.name,
    types,
    baseStats,
    sprites: {
      front: sd?.front_default ?? raw.sprites.front_default ?? art,
      back: sd?.back_default ?? raw.sprites.back_default ?? art,
      artwork: art,
    },
    movePool,
  };
}
