import { describe, it, expect } from 'vitest';
import { rarityToTier, TIER_ORDER } from './rarity';

describe('rarityToTier', () => {
  it.each([
    ['Special Illustration Rare', 'grail'], ['Hyper Rare', 'grail'], ['Rare Secret', 'grail'],
    ['Rare Rainbow', 'grail'], ['Rare Holo Star', 'grail'], ['Rare Shining', 'grail'],
    ['Illustration Rare', 'ultra'], ['Ultra Rare', 'ultra'], ['Double Rare', 'ultra'],
    ['Rare Holo VMAX', 'ultra'], ['Rare Holo VSTAR', 'ultra'], ['Rare Holo GX', 'ultra'], ['Rare Ultra', 'ultra'],
    ['Rare Holo', 'holo'], ['Rare', 'rare'], ['Uncommon', 'uncommon'], ['Common', 'common'],
  ])('%s → %s', (rarity, tier) => expect(rarityToTier(rarity)).toBe(tier));

  it('falls back by keyword for unknown strings', () => {
    expect(rarityToTier('Shiny Ultra Rare')).toBe('ultra');
    expect(rarityToTier('Trainer Gallery Rare Holo')).toBe('holo');
    expect(rarityToTier('Radiant Rare')).toBe('ultra');
  });

  it('falls back to rare for unknown or missing rarity', () => {
    expect(rarityToTier('Promo')).toBe('rare');
    expect(rarityToTier('Classic Collection')).toBe('rare');
    expect(rarityToTier(null)).toBe('rare');
    expect(rarityToTier(undefined)).toBe('rare');
  });

  it('orders tiers rarest first', () => {
    expect(TIER_ORDER).toEqual(['grail', 'ultra', 'holo', 'rare', 'uncommon', 'common']);
  });
});
