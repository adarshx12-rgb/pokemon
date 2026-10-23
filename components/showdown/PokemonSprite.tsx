'use client';
import { useReducedMotion } from 'framer-motion';
import type { BattlePokemon, Side } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import styles from './showdown.module.css';

export function PokemonSprite({ pokemon, side, classic }: { pokemon: BattlePokemon; side: Side; classic: boolean }) {
  const reduce = useReducedMotion();
  const battleSprite = side === 'A' ? pokemon.sprites.back : pokemon.sprites.front;
  // A still sprite is used as is (Mega forms share the species id, so rebuilding the URL from it shows the base form).
  const staticSprite = battleSprite?.endsWith('.png') ? battleSprite
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${side === 'A' ? 'back/' : ''}${pokemon.id}.png`;
  const src = classic ? (reduce ? staticSprite : battleSprite) ?? pokemon.sprites.artwork : pokemon.sprites.artwork ?? battleSprite;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={src} data-testid={`arena-pokemon-${side}`} src={src ?? undefined} alt={displayName(pokemon.name)} draggable={false}
      className={`${styles.pokemonSprite} ${classic ? styles.classicSprite : ''} ${!classic && side === 'A' ? styles.playerArtwork : ''}`}
      onError={e => {
        const image = e.currentTarget;
        const fallback = src === pokemon.sprites.artwork ? battleSprite : pokemon.sprites.artwork;
        if (!image.dataset.fallback && fallback && fallback !== src) { image.dataset.fallback = 'true'; image.src = fallback; }
      }} />
  );
}
