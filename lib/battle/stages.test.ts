import { describe, it, expect } from 'vitest';
import { ZERO_STAGES, statMultiplier, accuracyMultiplier, applyStage, hitChance } from './stages';

describe('statMultiplier', () => {
  it('follows (2+n)/2 and 2/(2-n)', () => {
    expect(statMultiplier(0)).toBe(1);
    expect(statMultiplier(1)).toBe(1.5);
    expect(statMultiplier(2)).toBe(2);
    expect(statMultiplier(6)).toBe(4);
    expect(statMultiplier(-1)).toBeCloseTo(2 / 3);
    expect(statMultiplier(-6)).toBe(0.25);
  });
});

describe('accuracyMultiplier', () => {
  it('follows (3+n)/3 and 3/(3-n)', () => {
    expect(accuracyMultiplier(-1)).toBe(0.75);
    expect(accuracyMultiplier(1)).toBeCloseTo(4 / 3);
  });
});

describe('applyStage', () => {
  it('clamps to +6 and reports the real change', () => {
    const r = applyStage({ ...ZERO_STAGES, atk: 5 }, 'atk', 2);
    expect(r.stages.atk).toBe(6);
    expect(r.applied).toBe(1);
  });
  it('applies 0 at the caps', () => {
    expect(applyStage({ ...ZERO_STAGES, atk: 6 }, 'atk', 1).applied).toBe(0);
    expect(applyStage({ ...ZERO_STAGES, atk: -6 }, 'atk', -1).applied).toBe(0);
  });
  it('does not mutate the input', () => {
    applyStage(ZERO_STAGES, 'def', 1);
    expect(ZERO_STAGES.def).toBe(0);
  });
});

describe('hitChance', () => {
  it('scales accuracy by the stage difference', () => {
    expect(hitChance(100, 0, 1)).toBe(0.75);
  });
  it('never misses for null accuracy', () => {
    expect(hitChance(null, -6, 6)).toBe(1);
  });
});
