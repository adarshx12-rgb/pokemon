'use client';
import type { BattlePokemon, Side } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import styles from './showdown.module.css';

export function spriteSrc(pokemon: BattlePokemon, side: Side, classic: boolean): string | null {
  const battleSprite = side === 'A' ? pokemon.sprites.back : pokemon.sprites.front;
  return classic ? battleSprite ?? pokemon.sprites.artwork : pokemon.sprites.artwork ?? battleSprite;
}

export const spriteClass = (side: Side, classic: boolean) =>
  `${styles.pokemonSprite} ${classic ? styles.classicSprite : ''} ${!classic && side === 'A' ? styles.playerArtwork : ''}`;

export function PokemonSprite({ pokemon, side, classic }: { pokemon: BattlePokemon; side: Side; classic: boolean }) {
  const battleSprite = side === 'A' ? pokemon.sprites.back : pokemon.sprites.front;
  const src = spriteSrc(pokemon, side, classic);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={src} data-testid={`arena-pokemon-${side}`} src={src ?? undefined} alt={displayName(pokemon.name)} draggable={false}
      className={spriteClass(side, classic)}
      onError={e => {
        const image = e.currentTarget;
        const fallback = src === pokemon.sprites.artwork ? battleSprite : pokemon.sprites.artwork;
        if (!image.dataset.fallback && fallback && fallback !== src) { image.dataset.fallback = 'true'; image.src = fallback; }
      }} />
  );
}
