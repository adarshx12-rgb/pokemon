import { describe, it, expect } from 'vitest';
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';
import { SHOWCASE } from '@/data/showcase';
import { SNAPSHOT } from './snapshot';
import { cardImagePatterns } from './imageAllowlist';

// Checked with Next's own matcher, so the brace lists mean exactly what the image optimizer will enforce.
const patterns = cardImagePatterns();
const allowed = (url: string) => hasRemoteMatch([], patterns, new URL(url));

describe('cardImagePatterns', () => {
  it('stays within Next’s 50-pattern limit', () => {
    expect(patterns.length).toBeLessThanOrEqual(50);
  });

  it('allows both scans of every showcase card', () => {
    for (const { id } of SHOWCASE) {
      const card = SNAPSHOT.find(c => c.id === id);
      expect(card, `snapshot is missing ${id}`).toBeDefined();
      expect(allowed(card!.images.small), card!.images.small).toBe(true);
      expect(allowed(card!.images.large), card!.images.large).toBe(true);
    }
  });

  it('rejects other scans, look-alike paths, and other hosts', () => {
    for (const url of [
      'https://images.pokemontcg.io/swsh12/1.png',
      'https://images.pokemontcg.io/base1/3.png', // same set as showcase cards, but not one of them
      'https://images.pokemontcg.io/base1/10_hires_x.png',
      'https://images.pokemontcg.io/base1/10_hires.png.evil',
      'https://images.pokemontcg.io/base1/sub/10.png',
      'http://images.pokemontcg.io/base1/10.png',
      'https://evil.example.com/base1/10.png',
    ]) expect(allowed(url), url).toBe(false);
  });
});
