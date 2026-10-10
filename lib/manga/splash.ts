import type { Card } from '@/lib/tcg/types';

/** Smallest tier that gets a 2×2 splash panel; smaller tiers would leave holes in the grid. */
const MIN_CARDS = 3;

/** The tier's highest-priced card, shown as a splash panel, or null when no card qualifies. */
export function splashCardId(cards: Card[]): string | null {
  if (cards.length < MIN_CARDS) return null;
  let best: Card | null = null;
  for (const c of cards) if (c.price && (!best || c.price.market > best.price!.market)) best = c;
  return best?.id ?? null;
}
