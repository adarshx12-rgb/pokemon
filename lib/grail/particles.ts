/** Gold dust around the spinning card. Pure: GlitterCanvas owns the canvas and the clock. */
export const GOLDS = ['255,226,150', '217,180,90', '255,241,184', '196,150,60'] as const;

/** Where particles spawn: the card's on-screen box. dir = horizontal drift (opposite the turn). */
export interface Emitter { x: number; y: number; w: number; h: number; dir: 1 | -1 }

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  age: number; life: number;
  /** Core radius in px (dust 0.5–2.9, motes 3–8). */
  size: number;
  alpha: number;
  /** Index into GOLDS. */
  color: number;
  /** A larger, soft, out-of-focus speck for depth. */
  mote: boolean;
}

const MOTE_SHARE = 0.07;

export function emit(pool: Particle[], count: number, e: Emitter, cap: number, rand: () => number = Math.random): void {
  const n = Math.min(count, cap - pool.length);
  for (let i = 0; i < n; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    const mote = rand() < MOTE_SHARE;
    const angle = (e.dir > 0 ? 0 : Math.PI) + (rand() - 0.5) * 1.4;
    const speed = 40 + rand() * 180;
    pool.push({
      x: e.x + side * (e.w / 2) * (0.8 + rand() * 0.4),
      y: e.y + (rand() - 0.5) * e.h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30, // a slight upward drift
      age: 0,
      life: 0.6 + rand() * 0.8,
      size: mote ? 3 + rand() * 5 : 0.5 + rand() ** 2 * 2.4,
      alpha: 0.3 + rand() * 0.7,
      color: Math.floor(rand() * GOLDS.length),
      mote,
    });
  }
}

export function step(pool: Particle[], dt: number): void {
  const drag = 0.35 ** dt;
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.age += dt;
    if (p.age >= p.life) {
      pool[i] = pool[pool.length - 1];
      pool.pop();
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= drag;
    p.vy *= drag;
  }
}

/** Whole particles to spawn this frame; the fraction carries to the next frame. */
export function emissionCount(rate: number, dt: number, perSecond: number, carry: number): { count: number; carry: number } {
  const exact = rate * perSecond * dt + carry;
  const count = Math.floor(exact);
  return { count, carry: exact - count };
}
