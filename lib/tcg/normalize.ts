import { rarityToTier } from '@/data/rarity';
import type { Card, Era, Price, RawCard } from './types';

const VARIANT_ORDER = ['holofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'reverseHolofoil', 'normal', '1stEditionNormal', 'unlimitedNormal'];

export function selectPrice(raw: RawCard): Price | null {
  const prices = raw.tcgplayer?.prices;
  if (prices) {
    const keys = [...VARIANT_ORDER, ...Object.keys(prices).filter(k => !VARIANT_ORDER.includes(k))];
    for (const key of keys) {
      const p = prices[key];
      if (p && typeof p.market === 'number' && p.market > 0) {
        return { market: p.market, low: p.low ?? null, high: p.high ?? null, source: 'TCGplayer', currency: 'USD', variant: key, updatedAt: raw.tcgplayer!.updatedAt };
      }
    }
  }
  const cm = raw.cardmarket?.prices;
  const avg = cm?.averageSellPrice ?? cm?.trendPrice;
  if (typeof avg === 'number' && avg > 0) {
    return { market: avg, low: null, high: null, source: 'Cardmarket', currency: 'EUR', variant: null, updatedAt: raw.cardmarket!.updatedAt };
  }
  return null;
}

export function eraOf(releaseDate: string): Era {
  return Number(releaseDate.slice(0, 4)) < 2003 ? 'vintage' : 'modern';
}

export function normalizeCard(raw: RawCard): Card {
  return {
    id: raw.id,
    name: raw.name,
    setName: raw.set.name,
    setSeries: raw.set.series,
    number: raw.number,
    rarity: raw.rarity ?? null,
    tier: rarityToTier(raw.rarity),
    era: eraOf(raw.set.releaseDate),
    images: raw.images,
    price: selectPrice(raw),
    releaseDate: raw.set.releaseDate,
  };
}

export function variantLabel(key: string | null): string {
  if (!key) return 'Average sell price';
  return key
    .replace(/^1st/, '1st ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPrice(price: Price): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, maximumFractionDigits: price.market >= 100 ? 0 : 2 }).format(price.market);
}
