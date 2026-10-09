export const TYPE_NAMES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type TypeName = (typeof TYPE_NAMES)[number];
export type DamageClass = 'physical' | 'special';

export interface Move {
  name: string; // PokéAPI slug, e.g. "fire-blast"
  type: TypeName;
  power: number;
  accuracy: number | null; // null = never misses
  damageClass: DamageClass;
}

export interface StatBlock { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

export interface Sprites { front: string | null; back: string | null; artwork: string | null }

export interface BattlePokemon {
  id: number;
  name: string; // PokéAPI slug
  types: TypeName[];
  baseStats: StatBlock;
  sprites: Sprites;
  movePool: Move[]; // damaging moves only
}

export interface TeamMember { pokemon: BattlePokemon; moves: Move[] }

export type Side = 'A' | 'B';

// In a `damage` event, side/index identify the target; in every other event, the actor.
export type BattleEvent =
  | { kind: 'switchIn'; side: Side; index: number; hp: number; maxHp: number }
  | { kind: 'useMove'; side: Side; index: number; move: Move }
  | { kind: 'miss'; side: Side; index: number }
  | { kind: 'damage'; side: Side; index: number; amount: number; hpAfter: number; effectiveness: number; crit: boolean }
  | { kind: 'faint'; side: Side; index: number }
  | { kind: 'end'; winner: Side; reason: 'knockout' | 'turnCap'; damageDealt: Record<Side, number[]> };

export type EndEvent = Extract<BattleEvent, { kind: 'end' }>;
