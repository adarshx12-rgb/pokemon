import { TYPE_NAMES, type BattlePokemon, type MegaForm, type Move, type StageStat, type StatBlock, type TypeName } from '@/lib/battle/types';

export interface RawMove {
  name: string;
  power: number | null;
  accuracy: number | null;
  type: { name: string };
  damage_class: { name: string };
  pp?: number;
  target?: { name: string };
  meta?: { category: { name: string } } | null;
  stat_changes?: { change: number; stat: { name: string } }[];
}

export interface RawPokemon {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  moves: {
    move: { name: string; url: string };
    version_group_details: {
      move_learn_method: { name: string };
      version_group: { name: string };
      level_learned_at: number;
    }[];
  }[];
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

// Moves whose drawback (self-KO, recharge, charge turn, first-turn-only, sleeping target, delayed hit)
// the engine does not simulate; left in, the best-move AI would pick them every turn for free.
const EXCLUDED_MOVES = new Set([
  'explosion', 'self-destruct', 'misty-explosion', 'mind-blown', 'steel-beam', 'chloroblast',
  'hyper-beam', 'giga-impact', 'blast-burn', 'hydro-cannon', 'frenzy-plant', 'rock-wrecker', 'roar-of-time',
  'prismatic-laser', 'eternabeam', 'meteor-assault',
  'solar-beam', 'solar-blade', 'sky-attack', 'skull-bash', 'razor-wind', 'fly', 'dig', 'dive', 'bounce',
  'phantom-force', 'shadow-force', 'meteor-beam', 'freeze-shock', 'ice-burn', 'electro-shot',
  'focus-punch', 'dream-eater', 'fake-out', 'first-impression', 'future-sight', 'doom-desire',
  'last-resort', 'belch', 'snore', 'synchronoise', 'burn-up', 'double-shock',
  // Stat moves with side effects the engine ignores (switch-out, HP cost, ally/field targets, ability or type changes).
  'parting-shot', 'clangorous-soul', 'no-retreat', 'stuff-cheeks', 'geomancy', 'venom-drench', 'captivate', 'decorate',
]);
const SELF_TARGETS = new Set(['user', 'user-and-allies', 'user-or-ally']);
const UNPLACEABLE_TARGETS = new Set(['ally', 'all-pokemon']); // no ally or whole-field effect in a 1v1 engine

const STAGE_STATS: Record<string, StageStat> = {
  attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd',
  speed: 'spe', accuracy: 'accuracy', evasion: 'evasion',
};

export function normalizeMove(raw: RawMove): Move | null {
  if (EXCLUDED_MOVES.has(raw.name)) return null;
  const cls = raw.damage_class.name;
  const pp = raw.pp && raw.pp > 0 ? raw.pp : 5;
  if (cls === 'status') {
    const changes = raw.stat_changes ?? [];
    if (UNPLACEABLE_TARGETS.has(raw.target?.name ?? '')) return null;
    if (raw.meta?.category.name !== 'net-good-stats' || !changes.length || !isType(raw.type.name)) return null;
    const statChanges = [];
    for (const c of changes) {
      const stat = STAGE_STATS[c.stat.name];
      if (!stat) return null;
      statChanges.push({ stat, change: c.change });
    }
    return {
      name: raw.name, type: raw.type.name, power: 0, accuracy: raw.accuracy, damageClass: 'status', pp,
      target: SELF_TARGETS.has(raw.target?.name ?? '') ? 'self' : 'foe', statChanges,
    };
  }
  if (cls !== 'physical' && cls !== 'special') return null;
  if (!raw.power || raw.power <= 0) return null;
  if (!isType(raw.type.name)) return null;
  return { name: raw.name, type: raw.type.name, power: raw.power, accuracy: raw.accuracy, damageClass: cls, pp };
}

const LEVEL_GROUPS = [
  'heartgold-soulsilver', 'scarlet-violet', 'sword-shield', 'ultra-sun-ultra-moon', 'sun-moon',
  'omega-ruby-alpha-sapphire', 'x-y', 'black-2-white-2', 'black-white',
];

// Level-up levels from the first preferred version group in which the species has any level-up entry.
export function levelUpLevels(raw: RawPokemon): Map<string, number> {
  const levelUps = raw.moves.flatMap(entry => entry.version_group_details
    .filter(d => d.move_learn_method.name === 'level-up')
    .map(d => ({ move: entry.move.name, group: d.version_group.name, level: Math.max(1, d.level_learned_at) })));
  const group = LEVEL_GROUPS.find(g => levelUps.some(l => l.group === g));
  const levels = new Map<string, number>();
  for (const l of levelUps) {
    if (l.group !== group) continue;
    const prev = levels.get(l.move);
    if (prev === undefined || l.level < prev) levels.set(l.move, l.level);
  }
  return levels;
}

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions';

export function pixelSprites(id: number): { front: string | null; back: string | null } {
  const dir = id <= 493 ? 'generation-iv/heartgold-soulsilver' : id <= 649 ? 'generation-v/black-white' : null;
  if (!dir) return { front: null, back: null };
  return { front: `${SPRITE_BASE}/${dir}/${id}.png`, back: `${SPRITE_BASE}/${dir}/back/${id}.png` };
}

function statsOf(raw: RawPokemon): StatBlock {
  const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const s of raw.stats) {
    const key = STAT_KEYS[s.stat.name];
    if (key) baseStats[key] = s.base_stat;
  }
  return baseStats;
}

const typesOf = (raw: RawPokemon) => [...raw.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name).filter(isType);

/** A Mega or Primal form from its PokéAPI entry. There are no HGSS/BW pixel sprites for these, so the newer ones are used. */
export function normalizeMega(raw: RawPokemon): MegaForm {
  const sd = raw.sprites.other?.showdown;
  const art = raw.sprites.other?.['official-artwork']?.front_default ?? null;
  return {
    name: raw.name,
    types: typesOf(raw),
    baseStats: statsOf(raw),
    sprites: { front: raw.sprites.front_default ?? sd?.front_default ?? art, back: raw.sprites.back_default ?? sd?.back_default ?? null, artwork: art },
  };
}

export function normalizePokemon(raw: RawPokemon, moves: RawMove[]): BattlePokemon {
  const baseStats = statsOf(raw);
  const types = typesOf(raw);
  const seen = new Set<string>();
  const learnset = new Map(raw.moves.map(entry => [entry.move.name,
    [...new Set(entry.version_group_details.map(detail => detail.move_learn_method.name))],
  ]));
  const levels = levelUpLevels(raw);
  const movePool: Move[] = [];
  for (const m of moves) {
    const learnMethods = learnset.get(m.name);
    // A fetched move definition alone is not evidence that this species can learn it.
    if (!learnMethods?.length) continue;
    const move = normalizeMove(m);
    if (move && !seen.has(move.name)) { seen.add(move.name); movePool.push({ ...move, learnMethods, ...(levels.has(move.name) && { level: levels.get(move.name) }) }); }
  }
  const sd = raw.sprites.other?.showdown;
  const art = raw.sprites.other?.['official-artwork']?.front_default ?? null;
  const pixel = pixelSprites(raw.id);
  return {
    id: raw.id,
    name: raw.name,
    types,
    baseStats,
    sprites: {
      front: pixel.front ?? sd?.front_default ?? raw.sprites.front_default ?? art,
      back: pixel.back ?? sd?.back_default ?? raw.sprites.back_default ?? art,
      artwork: art,
    },
    movePool,
  };
}
