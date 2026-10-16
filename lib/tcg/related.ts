import type { Card } from './types';

export type RelatedGroup = { kind: 'species' | 'set' | 'tier'; cards: Card[] };

/** "Charizard ex", "Shining Charizard" and "Blaine's Charizard" are all Charizard. */
export function speciesName(name: string): string {
  return name
    .replace(/^(Shining|Dark|Light|[A-Z][a-z]+'s)\s+/, '')
    .replace(/[\s-](ex|EX|GX|V|VMAX|VSTAR)$/, '')
    .replace(/\s*★$/, '')
    .trim();
}

export const speciesOf = (name: string) => speciesName(name).toLowerCase();

/**
 * Cards to link from a card page: the same Pokémon, then the same set (or, when the set has no
 * other card in the vault, the same tier). Each card appears once; `all` keeps the vault's order.
 */
export function relatedCards(card: Card, all: Card[], limit = 6): RelatedGroup[] {
  const others = all.filter(c => c.id !== card.id);
  const species = others.filter(c => speciesOf(c.name) === speciesOf(card.name)).slice(0, limit);
  const used = new Set(species.map(c => c.id));
  const rest = others.filter(c => !used.has(c.id));
  const sameSet = rest.filter(c => c.setName === card.setName);
  const second: RelatedGroup = sameSet.length > 0
    ? { kind: 'set', cards: sameSet.slice(0, limit) }
    : { kind: 'tier', cards: rest.filter(c => c.tier === card.tier).slice(0, limit) };
  return [{ kind: 'species' as const, cards: species }, second].filter(g => g.cards.length > 0);
}
