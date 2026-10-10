import { describe, expect, it } from 'vitest';
import { RECT, SHAPES, WIPE_TO, clipPolygon, svgPoints, wipeFrom } from './panel';

describe('clipPolygon', () => {
  it('formats percent points as a CSS polygon', () => {
    expect(clipPolygon(RECT)).toBe('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)');
  });
});

describe('svgPoints', () => {
  it('formats points for an SVG polygon in a 0-100 viewBox', () => {
    expect(svgPoints([[0, 0], [100, 4], [96, 100]])).toBe('0,0 100,4 96,100');
  });
});

describe('SHAPES', () => {
  it('keeps every point inside the 0-100 box', () => {
    for (const shape of Object.values(SHAPES))
      for (const [x, y] of shape) {
        expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(100);
      }
  });
  it('has at least three points per shape', () => {
    for (const shape of Object.values(SHAPES)) expect(shape.length).toBeGreaterThanOrEqual(3);
  });
});

describe('wipeFrom', () => {
  it('hides the panel from the side opposite the wipe origin', () => {
    expect(wipeFrom('left')).toBe('inset(0% 100% 0% 0%)');
    expect(wipeFrom('right')).toBe('inset(0% 0% 0% 100%)');
    expect(wipeFrom('up')).toBe('inset(100% 0% 0% 0%)');
    expect(wipeFrom('diag')).toBe('polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)');
  });
  it('ends fully revealed', () => {
    expect(WIPE_TO).toBe('inset(0% 0% 0% 0%)');
  });
});
