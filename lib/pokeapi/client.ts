import type { BattlePokemon } from '@/lib/battle/types';
import { fetchWithRetry } from '@/lib/http';
import { idFromUrl } from './names';
import { normalizePokemon, type RawMove, type RawPokemon } from './normalize';

const API = 'https://pokeapi.co/api/v2';
const WEEK = 604800;
const MAX_NATIONAL_DEX = 1025;
const CONCURRENCY = 16;

// In-process memo on top of Next's fetch cache, so a warm server never refetches a move.
const moveMemo = new Map<string, Promise<RawMove | null>>();

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetchWithRetry(url, { next: { revalidate: WEEK } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokéAPI returned ${res.status} for ${url}`);
  return (await res.json()) as T;
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
  const urls = raw.moves.map(m => m.move.url);
  const moves: RawMove[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = await Promise.all(urls.slice(i, i + CONCURRENCY).map(getMove));
    for (const m of batch) if (m) moves.push(m);
  }
  return normalizePokemon(raw, moves);
}

export async function getPokemonNames(): Promise<string[]> {
  const json = await getJson<{ results: { name: string; url: string }[] }>(`${API}/pokemon?limit=2000`);
  return (json?.results ?? []).filter(r => idFromUrl(r.url) <= MAX_NATIONAL_DEX).map(r => r.name);
}
