import type { Era } from '@/lib/tcg/types';

export interface Region { x: number; y: number; w: number; h: number }

export interface GuideItem { key: string; title: string; body: string; regions: Partial<Record<Era, Region>> }

export const GUIDE: GuideItem[] = [
  {
    key: 'rarity',
    title: 'Rarity symbol',
    body: 'Start with the symbol near the collector number: many older cards use a circle for common, a diamond for uncommon and a star for rare. Newer sets use additional symbols. Rarity and market value are separate things.',
    regions: { vintage: { x: 86, y: 91, w: 10, h: 5 }, modern: { x: 20, y: 92, w: 12, h: 5 } },
  },
  {
    key: 'number',
    title: 'Set symbol & card number',
    body: 'Match the set and full collector number, then the language and finish. Numbers such as 199/165 extend beyond the printed main-set total; a higher number does not guarantee a higher price.',
    regions: { vintage: { x: 70, y: 91, w: 16, h: 5 }, modern: { x: 3, y: 92, w: 18, h: 5 } },
  },
  {
    key: 'edition',
    title: '1st Edition stamp',
    body: 'Check for a 1st Edition stamp on applicable vintage releases. For English Base Set, also check the artwork-frame shadow to distinguish shadowless and unlimited printings. Compare matching editions; there is no fixed price multiplier.',
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
    body: 'Check centering, corners, edges, creases and surface scratches using photos of the actual card. A seller’s condition description is not a professional grade. Compare the same grading company and grade when researching graded copies.',
    regions: { vintage: { x: 0, y: 0, w: 100, h: 100 }, modern: { x: 0, y: 0, w: 100, h: 100 } },
  },
];

export function guideFor(era: Era) {
  return GUIDE.flatMap(({ regions, ...item }) => {
    const region = regions[era];
    return region ? [{ ...item, region }] : [];
  });
}
