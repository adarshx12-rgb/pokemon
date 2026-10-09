import { describe, it, expect } from 'vitest';
import { guideFor } from './identifyGuide';

describe('guideFor', () => {
  it('includes the 1st Edition stamp only for vintage cards', () => {
    expect(guideFor('vintage').map(g => g.key)).toContain('edition');
    expect(guideFor('modern').map(g => g.key)).not.toContain('edition');
  });
  it('resolves an in-bounds region for every item', () => {
    for (const era of ['vintage', 'modern'] as const) {
      for (const g of guideFor(era)) {
        expect(g.region.x + g.region.w).toBeLessThanOrEqual(100);
        expect(g.region.y + g.region.h).toBeLessThanOrEqual(100);
      }
    }
  });
});
