import { describe, expect, it } from 'vitest';
import type { Card, Price } from '@/lib/tcg/types';
import { splashCardId } from './splash';

const price = (market: number): Price => ({ market, low: null, high: null, source: 'TCGplayer', currency: 'USD', variant: null, updatedAt: '2026/10/10' });
const card = (id: string, p: Price | null): Card => ({
  id, name: id, setName: 's', setSeries: 's', number: '1', rarity: null, tier: 'grail', era: 'modern',
  images: { small: '', large: '' }, price: p, releaseDate: '2020-01-01',
});

describe('splashCardId', () => {
  it('picks the highest market price', () => {
    expect(splashCardId([card('a', price(10)), card('b', price(500)), card('c', price(40))])).toBe('b');
  });
  it('ignores unpriced cards', () => {
    expect(splashCardId([card('a', null), card('b', price(5)), card('c', null)])).toBe('b');
  });
  it('returns null when no card is priced', () => {
    expect(splashCardId([card('a', null), card('b', null), card('c', null)])).toBeNull();
  });
  it('returns null for tiers with fewer than 3 cards', () => {
    expect(splashCardId([card('a', price(9)), card('b', price(1))])).toBeNull();
  });
  it('keeps the first card on a tie', () => {
    expect(splashCardId([card('a', price(9)), card('b', price(9)), card('c', price(1))])).toBe('a');
  });
});
