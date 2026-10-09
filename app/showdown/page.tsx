import type { Metadata } from 'next';
import { Showdown } from '@/components/showdown/Showdown';
import { getPokemonNames } from '@/lib/pokeapi/client';

export const revalidate = 604800;
export const metadata: Metadata = { title: 'Showdown — Pokémon Vault' };

export default async function ShowdownPage() {
  let names: string[] = [];
  try {
    names = await getPokemonNames();
  } catch {
    names = [];
  }
  return <Showdown names={names} />;
}
