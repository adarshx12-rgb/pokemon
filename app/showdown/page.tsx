import type { Metadata } from 'next';
import { Showdown } from '@/components/showdown/Showdown';
import { getPokemonNames } from '@/lib/pokeapi/client';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 604800;
export const metadata: Metadata = pageMetadata({
  title: 'Pokemon Showdown — Local Battle Simulator',
  description: 'Build teams of up to six Pokémon, choose moves, and control both sides in pokefame’s simplified Pokémon showdown. Explore stats and type matchups in your browser.',
  path: '/showdown',
});

export default async function ShowdownPage() {
  return <Showdown names={await getPokemonNames()} />;
}
