import { describe, it, expect } from 'vitest';
import { groupByTier } from './rank';
import type { Card, Price } from './types';

const price = (market: number): Price => ({ market, low: null, high: null, source: 'TCGplayer', currency: 'USD', variant: 'holofoil', updatedAt: 'x' });
const card = (id: string, tier: Card['tier'], p: Price | null): Card => ({
  id, name: id, setName: 's', setSeries: 's', number: '1', rarity: null, tier, era: 'modern',
  images: { small: '', large: '' }, price: p, releaseDate: '2024/01/01',
});

describe('groupByTier', () => {
  it('orders tiers rarest first, skips empty tiers, sorts by price desc with unpriced last', () => {
    const groups = groupByTier([
      card('c1', 'common', price(1)), card('g-cheap', 'grail', price(100)),
      card('g-none', 'grail', null), card('g-rich', 'grail', price(900)),
    ]);
    expect(groups.map(g => g.tier)).toEqual(['grail', 'common']);
    expect(groups[0].cards.map(c => c.id)).toEqual(['g-rich', 'g-cheap', 'g-none']);
  });
});
