import { describe, it, expect } from 'vitest';
import { TYPE_COLORS } from '@/data/typeColors';
import { contrastRatio, moveButtonColors } from './contrast';

describe('contrast', () => {
  it('computes WCAG ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#F7D02C', '#ffffff')).toBeLessThan(2);
  });
  it('gives every type colour readable text', () => {
    for (const [type, color] of Object.entries(TYPE_COLORS)) {
      const { background, text } = moveButtonColors(color);
      expect(contrastRatio(background, text), type).toBeGreaterThanOrEqual(4.5);
    }
  });
});
