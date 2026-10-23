import { NextResponse } from 'next/server';
import SNAPSHOT from '@/data/pokedex-snapshot.json';
import { fetchPokemon } from '@/lib/pokeapi/client';
import { toSlug } from '@/lib/pokeapi/names';

// Every PokéAPI slug fits this (longest is 26 chars); anything else is rejected before it costs an upstream call.
const VALID_SLUG = /^[a-z0-9-]{1,40}$/;
// The Showdown only offers these (the live list is cut to the same national dex), so other names never reach PokéAPI.
const KNOWN = new Set(SNAPSHOT.names);
const CACHE_CONTROL = 'public, s-maxage=604800, stale-while-revalidate=86400';

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const slug = toSlug((await params).name);
  if (!VALID_SLUG.test(slug)) return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  if (!KNOWN.has(slug)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Edge cache keyed by the normalised slug, so case or spelling variants can't force repeat upstream calls.
  const cache = typeof caches === 'undefined' ? null : await caches.open('pokemon-api');
  const key = `https://pokefame.com/api/pokemon/v3/${slug}`;
  const hit = await cache?.match(key);
  if (hit) return hit;

  try {
    const pokemon = await fetchPokemon(slug);
    if (!pokemon) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const res = NextResponse.json(pokemon, { headers: { 'Cache-Control': CACHE_CONTROL } });
    await cache?.put(key, res.clone());
    return res;
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
