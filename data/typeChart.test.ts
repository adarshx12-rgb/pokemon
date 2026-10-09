import { describe, it, expect } from 'vitest';
import { effectiveness, typeMultiplier } from './typeChart';

describe('type chart', () => {
  it('handles super effective, resisted, neutral, and immune', () => {
    expect(effectiveness('fire', 'grass')).toBe(2);
    expect(effectiveness('fire', 'water')).toBe(0.5);
    expect(effectiveness('fire', 'normal')).toBe(1);
    expect(effectiveness('normal', 'ghost')).toBe(0);
    expect(effectiveness('electric', 'ground')).toBe(0);
    expect(effectiveness('dragon', 'fairy')).toBe(0);
  });
  it('multiplies across dual types', () => {
    expect(typeMultiplier('ice', ['dragon', 'flying'])).toBe(4);
    expect(typeMultiplier('fire', ['water', 'rock'])).toBe(0.25);
    expect(typeMultiplier('ground', ['electric', 'flying'])).toBe(0);
    expect(typeMultiplier('fighting', ['normal', 'ghost'])).toBe(0);
  });
});
