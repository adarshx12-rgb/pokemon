import { describe, expect, it } from 'vitest';
import { formatUpdated, priceCaption } from './format';

describe('formatUpdated', () => {
  it('turns the API date into a short label', () => {
    expect(formatUpdated('2026/10/09')).toBe('Oct 9, 2026');
  });
  it('returns null for missing or broken dates', () => {
    expect(formatUpdated(null)).toBeNull();
    expect(formatUpdated('soon')).toBeNull();
  });
});

describe('priceCaption', () => {
  it('falls back to "Unpriced" when there is no price', () => {
    expect(priceCaption('$2,501')).toBe('$2,501');
    expect(priceCaption(null)).toBe('Unpriced');
  });
});
