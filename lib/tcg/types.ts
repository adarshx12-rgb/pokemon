import type { Tier } from '@/data/rarity';

export type Era = 'vintage' | 'modern';

export interface Price {
  market: number;
  low: number | null;
  high: number | null;
  source: 'TCGplayer' | 'Cardmarket';
  currency: 'USD' | 'EUR';
  variant: string | null;
  updatedAt: string;
}

export interface Card {
  id: string;
  name: string;
  setName: string;
  setSeries: string;
  number: string;
  rarity: string | null;
  tier: Tier;
  era: Era;
  images: { small: string; large: string };
  price: Price | null;
  releaseDate: string;
}

interface RawVariantPrice { low?: number | null; mid?: number | null; high?: number | null; market?: number | null }

export interface RawCard {
  id: string;
  name: string;
  number: string;
  rarity?: string | null;
  set: { name: string; series: string; releaseDate: string };
  images: { small: string; large: string };
  tcgplayer?: { updatedAt: string; prices?: Record<string, RawVariantPrice> };
  cardmarket?: { updatedAt: string; prices?: { averageSellPrice?: number | null; trendPrice?: number | null } };
}
