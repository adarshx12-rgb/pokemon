import type { BattlePokemon, MegaForm, TypeName } from '@/lib/battle/types';
import { fetchWithRetry } from '@/lib/http';
import SNAPSHOT from '@/data/pokedex-snapshot.json';
import { idFromUrl } from './names';
import { normalizePokemon, type RawMove, type RawPokemon } from './normalize';

const API = 'https://pokeapi.co/api/v2';
const WEEK = 604800;
const MAX_NATIONAL_DEX = 1025;
const CONCURRENCY = 16;

// Move definitions rarely change, so they ship with the app (`npm run snapshot:pokedex`).
// Without it a single species needs 100–250 PokéAPI calls, which is slow cold and easily rate-limited.
const SNAPSHOT_MOVES = SNAPSHOT.moves as unknown as Record<string, SnapshotMove>;

// [type, power, accuracy, damageClass, pp, category, target, statChanges]
type SnapshotMove = [string, number | null, number | null, string, number, string | null, string, [string, number][]];

// [slug, types, [hp, atk, def, spa, spd, spe], front, back, artwork], keyed by the species' default Pokémon.
type SnapshotMega = [string, string[], [number, number, number, number, number, number], string | null, string | null, string | null];
const SNAPSHOT_MEGAS = (SNAPSHOT as unknown as { megas?: Record<string, SnapshotMega[]> }).megas ?? {};

/** The Mega Evolutions (and Primal forms) a Pokémon can take in battle, from the bundled snapshot. */
export function megaForms(name: string): MegaForm[] {
  return (SNAPSHOT_MEGAS[name] ?? []).map(([slug, types, [hp, atk, def, spa, spd, spe], front, back, artwork]) => ({
    name: slug, types: types as TypeName[], baseStats: { hp, atk, def, spa, spd, spe }, sprites: { front, back, artwork },
  }));
}

// In-process memo on top of Next's fetch cache, so a warm server never refetches a move.
const moveMemo = new Map<string, Promise<RawMove | null>>();

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetchWithRetry(url, { next: { revalidate: WEEK } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokéAPI returned ${res.status} for ${url}`);
  return (await res.json()) as T;
}

export function snapshotMove(name: string): RawMove | null {
  const entry = SNAPSHOT_MOVES[name];
  if (!entry) return null;
  const [type, power, accuracy, damageClass, pp, category, target, statChanges] = entry;
  return {
    name, power, accuracy, pp, type: { name: type }, damage_class: { name: damageClass },
    target: { name: target }, meta: category ? { category: { name: category } } : null,
    stat_changes: statChanges.map(([stat, change]) => ({ change, stat: { name: stat } })),
  };
}

function getMove(url: string): Promise<RawMove | null> {
  let p = moveMemo.get(url);
  if (!p) {
    p = getJson<RawMove>(url).catch(err => { moveMemo.delete(url); throw err; });
    moveMemo.set(url, p);
  }
  return p;
}

export async function fetchPokemon(slug: string): Promise<BattlePokemon | null> {
  const raw = await getJson<RawPokemon>(`${API}/pokemon/${encodeURIComponent(slug)}`);
  if (!raw) return null;
  const learned = raw.moves.filter(m => m.version_group_details.length > 0).map(m => m.move);
  const moves: RawMove[] = [];
  const unknown: string[] = [];
  for (const { name, url } of learned) {
    const known = snapshotMove(name);
    if (known) moves.push(known);
    else unknown.push(url);
  }
  // Only moves newer than the snapshot go to the network.
  for (let i = 0; i < unknown.length; i += CONCURRENCY) {
    const batch = await Promise.all(unknown.slice(i, i + CONCURRENCY).map(getMove));
    for (const m of batch) if (m) moves.push(m);
  }
  const pokemon = normalizePokemon(raw, moves);
  const megas = megaForms(pokemon.name);
  return megas.length ? { ...pokemon, megas } : pokemon;
}

// Falls back to the bundled list so the Showdown page still renders while PokéAPI is down.
export async function getPokemonNames(): Promise<string[]> {
  try {
    const json = await getJson<{ results: { name: string; url: string }[] }>(`${API}/pokemon?limit=2000`);
    const names = (json?.results ?? []).filter(r => idFromUrl(r.url) <= MAX_NATIONAL_DEX).map(r => r.name);
    if (names.length) return names;
  } catch (err) {
    console.warn('PokéAPI name list unavailable, using the bundled snapshot', err);
  }
  return SNAPSHOT.names;
}
