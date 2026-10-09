import { NextResponse } from 'next/server';
import { fetchPokemon } from '@/lib/pokeapi/client';
import { toSlug } from '@/lib/pokeapi/names';

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    const pokemon = await fetchPokemon(toSlug(name));
    if (!pokemon) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(pokemon, {
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
