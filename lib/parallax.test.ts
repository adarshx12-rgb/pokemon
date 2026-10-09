import { describe, it, expect } from 'vitest';
import { layerSize, parallaxOffset } from './parallax';

const ASPECT = 27 / 16; // height / width of the marble image

describe('layerSize', () => {
  it('spans the viewport width on desktop', () => {
    expect(layerSize(1440, 900, ASPECT)).toEqual({ width: 1440, height: 1440 * ASPECT });
  });
  it('widens past the viewport on narrow screens so it is still taller than the screen', () => {
    const { width, height } = layerSize(390, 844, ASPECT);
    expect(width).toBeGreaterThan(390);
    expect(height).toBeGreaterThanOrEqual(844 * 1.3);
  });
});

describe('parallaxOffset', () => {
  const base = { viewportH: 900, layerH: 2430, maxFactor: 0.3 };

  it('starts at 0 and moves up as you scroll', () => {
    expect(parallaxOffset({ ...base, scrollY: 0, docH: 2000 })).toBe(0);
    expect(parallaxOffset({ ...base, scrollY: 1000, docH: 2000 })).toBe(-300);
  });

  it('slows down on long pages so the layer never runs out', () => {
    const docH = 10000;
    const end = parallaxOffset({ ...base, scrollY: docH - base.viewportH, docH });
    expect(end).toBe(-(base.layerH - base.viewportH));
  });

  it('never moves past the bottom of the layer', () => {
    const y = parallaxOffset({ ...base, scrollY: 50000, docH: 10000 });
    expect(y).toBeGreaterThanOrEqual(-(base.layerH - base.viewportH));
  });

  it('stays put when the page does not scroll or the layer has no spare height', () => {
    expect(parallaxOffset({ ...base, scrollY: 0, docH: 900 })).toBe(0);
    expect(parallaxOffset({ ...base, layerH: 800, scrollY: 500, docH: 3000 })).toBe(0);
  });
});
