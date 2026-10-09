import type { Era } from '@/lib/tcg/types';

export interface Region { x: number; y: number; w: number; h: number }

export interface GuideItem { key: string; title: string; body: string; regions: Partial<Record<Era, Region>> }

export const GUIDE: GuideItem[] = [
  {
    key: 'rarity',
    title: 'Rarity symbol',
    body: 'Found at the bottom of the card: ● common, ◆ uncommon, ★ rare. Modern sets use extra and gold stars for illustration, special illustration, and hyper rares, which are the cards that drive set value.',
    regions: { vintage: { x: 86, y: 91, w: 10, h: 5 }, modern: { x: 20, y: 92, w: 12, h: 5 } },
  },
  {
    key: 'number',
    title: 'Set symbol & card number',
    body: 'Tells you exactly which printing you have. A number above the set total (e.g. 199/165) marks a secret rare, almost always the most valuable cards in a set.',
    regions: { vintage: { x: 70, y: 91, w: 16, h: 5 }, modern: { x: 3, y: 92, w: 18, h: 5 } },
  },
  {
    key: 'edition',
    title: '1st Edition stamp',
    body: 'A black “Edition 1” stamp just left of the artwork box marks the first print run and can multiply value 5–10×. On Base Set, “Shadowless” copies (no drop shadow on the right of the art frame) rank next.',
    regions: { vintage: { x: 6, y: 52, w: 12, h: 6 } },
  },
  {
    key: 'holo',
    title: 'Holo pattern & variant',
    body: 'Holofoil artwork, reverse holo (foil on the card body), or textured full art. Each variant has its own market price, so match yours before trusting a number.',
    regions: { vintage: { x: 9, y: 11, w: 82, h: 42 }, modern: { x: 6, y: 9, w: 88, h: 48 } },
  },
  {
    key: 'condition',
    title: 'Condition & grading',
    body: 'Check centering, corners, edges, and surface scratches. A PSA 10 can sell for many times a raw copy, and a PSA 9 often goes for half of a 10. The prices shown here are for raw, ungraded cards.',
    regions: { vintage: { x: 0, y: 0, w: 100, h: 100 }, modern: { x: 0, y: 0, w: 100, h: 100 } },
  },
];

export function guideFor(era: Era) {
  return GUIDE.flatMap(({ regions, ...item }) => {
    const region = regions[era];
    return region ? [{ ...item, region }] : [];
  });
}
