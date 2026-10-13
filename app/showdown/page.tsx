import type { Metadata } from 'next';
import { Showdown } from '@/components/showdown/Showdown';
import { getPokemonNames } from '@/lib/pokeapi/client';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 604800;
export const metadata: Metadata = pageMetadata({
  title: 'Pokemon Showdown — Local Battle Simulator',
  description: 'Build teams of up to six Pokémon, choose moves, and control both sides in hipokémon’s simplified Pokémon showdown. Explore stats and type matchups in your browser.',
  path: '/showdown',
});

// Errors propagate on purpose: ISR then keeps serving the last good page instead of caching
// an empty Pokédex for the whole revalidate window.
export default async function ShowdownPage() {
  const names = await getPokemonNames();
  if (names.length === 0) throw new Error('PokéAPI returned no Pokémon names');
  return <Showdown names={names} />;
}
