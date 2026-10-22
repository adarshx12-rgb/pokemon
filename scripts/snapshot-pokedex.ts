import { writeFileSync } from 'node:fs';
import { fetchWithRetry } from '../lib/http';
import { idFromUrl } from '../lib/pokeapi/names';
import type { RawMove } from '../lib/pokeapi/normalize';

const API = 'https://pokeapi.co/api/v2';
const MAX_NATIONAL_DEX = 1025;
const CONCURRENCY = 16;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`PokéAPI returned ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const pokemon = await getJson<{ results: { name: string; url: string }[] }>(`${API}/pokemon?limit=2000`);
  const names = pokemon.results.filter(r => idFromUrl(r.url) <= MAX_NATIONAL_DEX).map(r => r.name);

  const list = await getJson<{ results: { name: string; url: string }[] }>(`${API}/move?limit=2000`);
  // Every move is kept (status moves too), so the runtime can tell "not damaging" apart from "newer than the snapshot".
  const moves: Record<string, unknown[]> = {};
  for (let i = 0; i < list.results.length; i += CONCURRENCY) {
    const batch = await Promise.all(list.results.slice(i, i + CONCURRENCY).map(m => getJson<RawMove>(m.url)));
    for (const m of batch) moves[m.name] = [
      m.type.name, m.power, m.accuracy, m.damage_class.name, m.pp ?? 5, m.meta?.category.name ?? null,
      m.target?.name ?? 'selected-pokemon', (m.stat_changes ?? []).map(c => [c.stat.name, c.change]),
    ];
  }

  writeFileSync('data/pokedex-snapshot.json', JSON.stringify({ names, moves }) + '\n');
  console.log(`Wrote ${names.length} Pokémon and ${Object.keys(moves).length} moves to data/pokedex-snapshot.json`);
}

main();
