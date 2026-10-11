/** Shape of the two indigo mesh walls. horizon is a fraction of the canvas height. */
export interface MeshShape { open: number; height: number; amp: number; horizon: number }

/** Resting shape, tuned at 1440×900 in the approved mockup. */
export const MESH_DEFAULT: MeshShape = { open: 0.36, height: 1500, amp: 1.6, horizon: 0.52 };

export interface MeshLight { x: number; y: number; r: number; strength: number }
export interface MeshPoint { x: number; y: number; alpha: number; lit: number }

export const GRID = { cols: 56, rows: 40 } as const;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Perspective-projects the wave grid onto a w×h canvas: two walls that rise toward the left and right
 * edges and fade to black in the centre. Rows run near → far. Tuned at 1440×900 (focal 900, camera
 * height 260); lengths scale with the canvas so phones get narrower walls.
 */
export function projectGrid(shape: MeshShape, timeSec: number, w: number, h: number, light: MeshLight | null = null): MeshPoint[][] {
  const k = h / 900;
  const halfWidth = 2100 * (w / 1440);
  const horizon = shape.horizon * h;
  const phase = timeSec * 0.15;
  const rows: MeshPoint[][] = [];
  for (let r = 0; r < GRID.rows; r++) {
    const v = r / (GRID.rows - 1);
    const z = 220 + v * 2200;
    const depthFade = (1 - v) ** 0.8;
    const row: MeshPoint[] = [];
    for (let c = 0; c < GRID.cols; c++) {
      const u = (c / (GRID.cols - 1)) * 2 - 1;
      const side = Math.abs(u);
      const wall = Math.max(0, (side - shape.open) / (1 - shape.open)) ** 1.6;
      const wave =
        Math.sin(u * 5.1 + v * 7.3 + phase) * 0.5 +
        Math.sin(u * 2.3 - v * 11 + 1.7 + phase * 0.7) * 0.35 +
        Math.cos(v * 4 + u * 9 - phase * 0.5) * 0.25;
      const y = (wall * shape.height + wave * (40 + wall * 120) * shape.amp) * k;
      const x = w / 2 + (u * halfWidth * 900) / z;
      const sy = horizon + ((260 * k - y) * 900) / z;
      const alpha = depthFade * clamp01((side - shape.open * 0.7) / 0.3);
      const lit = light ? clamp01(1 - Math.hypot(x - light.x, sy - light.y) / light.r) * light.strength : 0;
      row.push({ x, y: sy, alpha, lit });
    }
    rows.push(row);
  }
  return rows;
}
