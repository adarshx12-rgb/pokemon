import { describe, it, expect } from 'vitest';
import { normalizeCard, selectPrice, variantLabel } from './normalize';
import type { RawCard } from './types';

const raw: RawCard = {
  id: 'base1-4', name: 'Charizard', number: '4', rarity: 'Rare Holo',
  set: { name: 'Base', series: 'Base', releaseDate: '1999/01/09' },
  images: { small: 'https://images.pokemontcg.io/base1/4.png', large: 'https://images.pokemontcg.io/base1/4_hires.png' },
  tcgplayer: { updatedAt: '2026/10/09', prices: { '1stEditionHolofoil': { low: 3000, high: 20000, market: 9000 }, unlimitedHolofoil: { low: 300, high: 2000, market: 420 } } },
  cardmarket: { updatedAt: '2026/10/09', prices: { averageSellPrice: 380 } },
};

describe('selectPrice', () => {
  it('prefers holofoil, then 1st edition holofoil', () => {
    expect(selectPrice(raw)).toEqual({ market: 9000, low: 3000, high: 20000, source: 'TCGplayer', currency: 'USD', variant: '1stEditionHolofoil', updatedAt: '2026/10/09' });
    const withHolo: RawCard = { ...raw, tcgplayer: { updatedAt: 'x', prices: { normal: { market: 1 }, holofoil: { market: 50, low: 40, high: 60 } } } };
    expect(selectPrice(withHolo)?.variant).toBe('holofoil');
  });
  it('skips variants without a market price', () => {
    const r: RawCard = { ...raw, tcgplayer: { updatedAt: 'x', prices: { holofoil: { market: null, low: 1 }, normal: { market: 2 } } } };
    expect(selectPrice(r)?.variant).toBe('normal');
  });
  it('falls back to Cardmarket in EUR', () => {
    const r: RawCard = { ...raw, tcgplayer: undefined };
    expect(selectPrice(r)).toEqual({ market: 380, low: null, high: null, source: 'Cardmarket', currency: 'EUR', variant: null, updatedAt: '2026/10/09' });
  });
  it('returns null with no price data at all', () => {
    expect(selectPrice({ ...raw, tcgplayer: undefined, cardmarket: undefined })).toBeNull();
  });
});

describe('normalizeCard', () => {
  it('maps fields, tier, and era', () => {
    const c = normalizeCard(raw);
    expect(c).toMatchObject({ id: 'base1-4', name: 'Charizard', setName: 'Base', number: '4', tier: 'holo', era: 'vintage' });
    expect(normalizeCard({ ...raw, set: { ...raw.set, releaseDate: '2023/09/22' } }).era).toBe('modern');
  });
});

describe('variantLabel', () => {
  it('humanizes variant keys', () => {
    expect(variantLabel('1stEditionHolofoil')).toBe('1st Edition Holofoil');
    expect(variantLabel('reverseHolofoil')).toBe('Reverse Holofoil');
    expect(variantLabel(null)).toBe('Average sell price');
  });
});
