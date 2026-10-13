export type Tier = 'grail' | 'ultra' | 'holo' | 'rare' | 'uncommon' | 'common';

export const TIER_ORDER: Tier[] = ['grail', 'ultra', 'holo', 'rare', 'uncommon', 'common'];

export const TIER_META: Record<Tier, { label: string; blurb: string }> = {
  grail: { label: 'Grail', blurb: 'Secret, hyper, gold star and special illustration rares — the cards collectors chase for years.' },
  ultra: { label: 'Ultra', blurb: 'Illustration rares, full arts and rule-box Pokémon (V, VMAX, ex, GX).' },
  holo: { label: 'Holo', blurb: 'Classic holofoil rares — the shine that started it all.' },
  rare: { label: 'Rare', blurb: 'Classic non-holo rares and selected promos — distinctive prints beyond the main-set checklist.' },
  uncommon: { label: 'Uncommon', blurb: 'Marked with a diamond. Plentiful, but key to completing a set.' },
  common: { label: 'Common', blurb: 'Marked with a circle. Every pack has them — but mint vintage commons still surprise.' },
};

const EXACT: Record<string, Tier> = {
  'special illustration rare': 'grail', 'hyper rare': 'grail', 'rare secret': 'grail', 'rare rainbow': 'grail',
  'rare holo star': 'grail', 'rare shining': 'grail', 'rare shiny gx': 'ultra',
  'illustration rare': 'ultra', 'ultra rare': 'ultra', 'double rare': 'ultra', 'rare ultra': 'ultra',
  'rare holo v': 'ultra', 'rare holo vmax': 'ultra', 'rare holo vstar': 'ultra', 'rare holo ex': 'ultra',
  'rare holo gx': 'ultra', 'rare holo lv.x': 'ultra', 'rare prism star': 'ultra',
  'rare holo': 'holo', 'rare': 'rare', 'uncommon': 'uncommon', 'common': 'common',
};

const KEYWORDS: [RegExp, Tier][] = [
  [/secret|rainbow|hyper|special illustration|gold star|shining/, 'grail'],
  [/illustration|ultra|vmax|vstar|\bv\b|\bex\b|\bgx\b|double|radiant|amazing|legend|lv\.x|prime|break|ace spec|shiny/, 'ultra'],
  [/holo/, 'holo'],
];

export function rarityToTier(rarity: string | null | undefined): Tier {
  if (!rarity) return 'rare';
  const key = rarity.trim().toLowerCase();
  if (EXACT[key]) return EXACT[key];
  for (const [re, tier] of KEYWORDS) if (re.test(key)) return tier;
  return 'rare';
}
