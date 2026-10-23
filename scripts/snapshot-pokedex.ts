import { readFileSync, writeFileSync } from 'node:fs';
import { fetchWithRetry } from '../lib/http';
import { idFromUrl } from '../lib/pokeapi/names';
import { normalizeMega, type RawMove, type RawPokemon } from '../lib/pokeapi/normalize';

const API = 'https://pokeapi.co/api/v2';
const MAX_NATIONAL_DEX = 1025;
const CONCURRENCY = 16;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`PokéAPI returned ${res.status} for ${url}`);
  return (await res.json()) as T;
}

type Listing = { results: { name: string; url: string }[] };
// Every Mega and Primal form is its own PokéAPI entry, named after its base species.
const IS_MEGA = /-(mega|primal)(-|$)/;

/** Mega and Primal forms keyed by the species' default Pokémon (the one the Showdown offers): [slug, types, [hp, atk, def, spa, spd, spe], front, back, artwork]. */
async function snapshotMegas(pokemon: Listing) {
  const megas: Record<string, unknown[][]> = {};
  const forms = pokemon.results.filter(r => IS_MEGA.test(r.name));
  for (let i = 0; i < forms.length; i += CONCURRENCY) {
    const batch = await Promise.all(forms.slice(i, i + CONCURRENCY).map(async f => {
      const raw = await getJson<RawPokemon & { species: { url: string } }>(f.url);
      const species = await getJson<{ varieties: { is_default: boolean; pokemon: { name: string } }[] }>(raw.species.url);
      const owner = species.varieties.find(v => v.is_default)!.pokemon.name;
      const m = normalizeMega(raw);
      const st = m.baseStats;
      return [owner, [m.name, m.types, [st.hp, st.atk, st.def, st.spa, st.spd, st.spe], m.sprites.front, m.sprites.back, m.sprites.artwork]] as const;
    }));
    for (const [owner, form] of batch) (megas[owner] ??= []).push([...form]);
  }
  return megas;
}

async function main() {
  const pokemon = await getJson<Listing>(`${API}/pokemon?limit=2000`);
  // `--megas` refreshes only the Mega forms and keeps the bundled move data.
  if (process.argv.includes('--megas')) {
    const snapshot = JSON.parse(readFileSync('data/pokedex-snapshot.json', 'utf8'));
    snapshot.megas = await snapshotMegas(pokemon);
    writeFileSync('data/pokedex-snapshot.json', JSON.stringify(snapshot) + '\n');
    console.log(`Wrote Mega forms for ${Object.keys(snapshot.megas).length} Pokémon to data/pokedex-snapshot.json`);
    return;
  }
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

  const megas = await snapshotMegas(pokemon);
  writeFileSync('data/pokedex-snapshot.json', JSON.stringify({ names, moves, megas }) + '\n');
  console.log(`Wrote ${names.length} Pokémon and ${Object.keys(moves).length} moves to data/pokedex-snapshot.json`);
}

main();
