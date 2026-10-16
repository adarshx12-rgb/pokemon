import { describe, it, expect } from 'vitest';
import { relatedCards, speciesOf } from './related';
import type { Card } from './types';

const card = (id: string, name: string, setName: string, tier: Card['tier'] = 'holo'): Card => ({
  id, name, setName, setSeries: 's', number: '1', rarity: null, tier, era: 'modern',
  images: { small: '', large: '' }, price: null, releaseDate: '2024/01/01',
});

describe('speciesOf', () => {
  it('drops card mechanics and trainer prefixes', () => {
    expect(['Charizard ex', 'Shining Charizard', "Blaine's Charizard", 'Charizard VSTAR', 'Charizard'].map(speciesOf)).toEqual(Array(5).fill('charizard'));
    expect(['Umbreon VMAX', 'Umbreon V', 'Mew-EX', 'Rayquaza ★'].map(speciesOf)).toEqual(['umbreon', 'umbreon', 'mew', 'rayquaza']);
  });
});

describe('relatedCards', () => {
  const all = [
    card('a', 'Charizard ex', '151', 'grail'), card('b', 'Charizard', 'Base'), card('c', 'Blastoise ex', '151', 'grail'),
    card('d', 'Pikachu', '151', 'common'), card('e', 'Lugia', 'Neo Genesis', 'holo'), card('f', 'Gengar', 'Fossil', 'holo'),
  ];

  it('groups the same Pokémon first, then the same set, without repeats or the card itself', () => {
    const groups = relatedCards(all[0], all);
    expect(groups.map(g => [g.kind, g.cards.map(c => c.id)])).toEqual([['species', ['b']], ['set', ['c', 'd']]]);
  });

  it('falls back to the same tier when the set has no other cards', () => {
    const groups = relatedCards(all[4], all);
    expect(groups.map(g => [g.kind, g.cards.map(c => c.id)])).toEqual([['tier', ['b', 'f']]]);
  });

  it('caps each group', () => {
    const many = Array.from({ length: 10 }, (_, i) => card(`p${i}`, 'Pikachu', `set${i}`));
    expect(relatedCards(many[0], many, 4)[0].cards).toHaveLength(4);
  });
});
