import { describe, it, expect } from 'vitest';
import { displayName, idFromUrl, toSlug } from './names';

describe('toSlug', () => {
  it.each([
    [' Pikachu ', 'pikachu'], ['Mr. Mime', 'mr-mime'], ["Farfetch'd", 'farfetchd'],
    ['Nidoran♀', 'nidoran-f'], ['Nidoran♂', 'nidoran-m'], ['Tapu  Koko', 'tapu-koko'], ['ho_oh', 'ho-oh'],
  ])('%s → %s', (input, slug) => expect(toSlug(input)).toBe(slug));
});

describe('displayName', () => {
  it('title-cases slugs', () => expect(displayName('mr-mime')).toBe('Mr Mime'));
});

describe('idFromUrl', () => {
  it('extracts the trailing id', () => expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25));
});
