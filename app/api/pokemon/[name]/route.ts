import { NextResponse } from 'next/server';
import { fetchPokemon } from '@/lib/pokeapi/client';
import { toSlug } from '@/lib/pokeapi/names';

// Every PokéAPI slug fits this (longest is 26 chars); anything else is rejected before it costs an upstream call.
const VALID_SLUG = /^[a-z0-9-]{1,40}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const slug = toSlug((await params).name);
  if (!VALID_SLUG.test(slug)) return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  try {
    const pokemon = await fetchPokemon(slug);
    if (!pokemon) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(pokemon, {
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
