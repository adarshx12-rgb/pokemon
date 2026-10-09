import { TIER_ORDER, type Tier } from '@/data/rarity';
import type { Card } from './types';

export function groupByTier(cards: Card[]): { tier: Tier; cards: Card[] }[] {
  return TIER_ORDER.map(tier => ({
    tier,
    cards: cards
      .filter(c => c.tier === tier)
      .sort((a, b) => (b.price?.market ?? -1) - (a.price?.market ?? -1)),
  })).filter(g => g.cards.length > 0);
}
