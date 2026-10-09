import { writeFileSync } from 'node:fs';
import { SHOWCASE } from '../data/showcase';
import { fetchRawCards } from '../lib/tcg/client';
import type { RawCard } from '../lib/tcg/types';

// Keep only the fields normalizeCard reads, so the committed file stays small.
const trim = (c: RawCard): RawCard => ({
  id: c.id, name: c.name, number: c.number, rarity: c.rarity ?? null,
  set: { name: c.set.name, series: c.set.series, releaseDate: c.set.releaseDate },
  images: { small: c.images.small, large: c.images.large },
  tcgplayer: c.tcgplayer && { updatedAt: c.tcgplayer.updatedAt, prices: c.tcgplayer.prices },
  cardmarket: c.cardmarket && {
    updatedAt: c.cardmarket.updatedAt,
    prices: { averageSellPrice: c.cardmarket.prices?.averageSellPrice ?? null, trendPrice: c.cardmarket.prices?.trendPrice ?? null },
  },
});

async function main() {
  const cards = await fetchRawCards(SHOWCASE.map(s => s.id));
  const missing = SHOWCASE.filter(s => !cards.some(c => c.id === s.id)).map(s => s.id);
  writeFileSync('data/showcase-snapshot.json', JSON.stringify(cards.map(trim), null, 1) + '\n');
  console.log(`Wrote ${cards.length} cards to data/showcase-snapshot.json${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
}

main();
