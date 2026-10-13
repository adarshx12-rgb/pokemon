import { describe, expect, it } from 'vitest';
import { SHOWCASE } from '@/data/showcase';
import { COLLECTOR_NOTES } from '@/data/collectorNotes';
import { SNAPSHOT } from './snapshot';
import { normalizeCard } from './normalize';
import { collectorInfo } from './collector';

describe('collector content coverage', () => {
  it('supplies specific notes and sourced identity details for every card in the Vault', () => {
    for (const { id } of SHOWCASE) {
      const card = normalizeCard(SNAPSHOT.find(card => card.id === id)!);
      expect(COLLECTOR_NOTES[id], id).toBeDefined();
      const info = collectorInfo(card);
      expect(info.artist, id).toBeTruthy();
      if (card.rarity === 'Promo') expect(info.number, id).toBe(card.number);
      else expect(info.number, id).toMatch(/^[A-Za-z]*\d+\/[A-Za-z]*\d+$/);
      expect(info.language).toBe('English');
      expect(info.note.appeal.length).toBeGreaterThan(40);
      expect(info.note.check.length).toBeGreaterThan(40);
      expect(info.note.collect.length).toBeGreaterThan(40);
    }
  });
  it('does not invent artist, language or set totals for cards outside the curated catalog', () => {
    const card = { ...normalizeCard(SNAPSHOT[0]), id: 'unknown-1', number: '1' };
    expect(collectorInfo(card)).toMatchObject({ artist: null, language: 'Not recorded', number: '1' });
  });
});
