/** A point in percent of the panel box (0-100 on both axes). */
export type Pt = readonly [number, number];
export type Shape = readonly Pt[];

export const RECT: Shape = [[0, 0], [100, 0], [100, 100], [0, 100]];

/** Angled panel outlines. Angles stay small (≤ 6%) so they read on mobile too. */
export const SHAPES = {
  heroMain: [[0, 0], [100, 0], [94, 100], [0, 100]],
  heroCard: [[6, 0], [100, 0], [100, 100], [0, 100]],
  heroInset: [[4, 0], [100, 0], [100, 100], [0, 100]],
  tiltL: [[0, 0], [100, 3], [100, 100], [0, 97]],
  tiltR: [[0, 3], [100, 0], [100, 97], [0, 100]],
  wedgeL: [[0, 0], [100, 0], [96, 100], [0, 100]],
  wedgeR: [[4, 0], [100, 0], [100, 100], [0, 100]],
  banner: [[0, 0], [100, 0], [100, 88], [0, 100]],
} satisfies Record<string, Shape>;

const pct = (n: number) => `${n}%`;

export function clipPolygon(shape: Shape): string {
  return `polygon(${shape.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(', ')})`;
}

export function svgPoints(shape: Shape): string {
  return shape.map(([x, y]) => `${x},${y}`).join(' ');
}

export type WipeDir = 'left' | 'right' | 'up' | 'diag';

/** Clip-path a panel starts from before wiping in from `dir`. */
export function wipeFrom(dir: WipeDir): string {
  switch (dir) {
    case 'left': return 'inset(0% 100% 0% 0%)';
    case 'right': return 'inset(0% 0% 0% 100%)';
    case 'up': return 'inset(100% 0% 0% 0%)';
    case 'diag': return 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)';
  }
}

export const WIPE_TO = 'inset(0% 0% 0% 0%)';
/** End state for the diagonal wipe (polygon and inset can't interpolate into each other). */
export const WIPE_TO_DIAG = 'polygon(0% 0%, 200% 0%, 0% 200%, 0% 0%)';
