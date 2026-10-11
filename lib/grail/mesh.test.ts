import { describe, expect, it } from 'vitest';
import { GRID, MESH_DEFAULT, projectGrid } from './mesh';

const grid = (t = 0, light = null as Parameters<typeof projectGrid>[4]) => projectGrid(MESH_DEFAULT, t, 1440, 900, light);

describe('projectGrid', () => {
  it('returns rows × cols points', () => {
    const g = grid();
    expect(g).toHaveLength(GRID.rows);
    g.forEach(row => expect(row).toHaveLength(GRID.cols));
  });
  it('fades the centre to black so the card has empty space', () => {
    const g = grid();
    const mid = Math.floor(GRID.cols / 2);
    for (const row of g) {
      expect(row[mid].alpha).toBe(0);
      expect(row[mid - 1].alpha).toBe(0);
    }
  });
  it('fades out with depth along an outer column', () => {
    const g = grid();
    const alphas = g.map(row => row[2].alpha);
    alphas.slice(1).forEach((a, i) => expect(a).toBeLessThanOrEqual(alphas[i]));
    expect(alphas[0]).toBeGreaterThan(0.5);
    expect(alphas[GRID.rows - 1]).toBeLessThan(0.05);
  });
  it('drifts over time', () => {
    expect(grid(0)[5][3].y).not.toBeCloseTo(grid(3)[5][3].y, 3);
    expect(grid(2)[5][3]).toEqual(grid(2)[5][3]);
  });
  it('only lights dots near the gold light', () => {
    expect(grid().flat().every(p => p.lit === 0)).toBe(true);
    const near = grid(0)[4][3];
    const lit = grid(0, { x: near.x, y: near.y, r: 200, strength: 0.8 });
    expect(lit[4][3].lit).toBeCloseTo(0.8);
    expect(lit[4][GRID.cols - 4].lit).toBe(0); // the far wall is out of range
  });
});
