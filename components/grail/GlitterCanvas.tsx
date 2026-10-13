'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { GOLDS, emissionCount, emit, step, type Particle } from '@/lib/grail/particles';
import { grailStore } from '@/lib/grail/store';

const DUST_RADII = [1, 1.5, 2, 2.5, 3.5];
const MOTE_RADII = [4, 6, 8];

/** A soft round gold dot, pre-rendered once so each frame is just drawImage calls. */
function sprite(rgb: string, r: number, mote: boolean): HTMLCanvasElement {
  const radius = mote ? r : r * 2.2; // dust gets a glow halo around its core
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(radius * 2) + 2;
  const g = c.getContext('2d')!;
  const m = c.width / 2;
  const grad = g.createRadialGradient(m, m, 0, m, m, radius);
  grad.addColorStop(0, `rgba(${rgb},${mote ? 0.35 : 1})`);
  grad.addColorStop(mote ? 0.7 : 0.45, `rgba(${rgb},${mote ? 0.2 : 0.6})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(m, m, radius, 0, Math.PI * 2);
  g.fill();
  return c;
}

const nearest = (radii: number[], size: number) =>
  radii.reduce((best, r, i) => (Math.abs(r - size) < Math.abs(radii[best] - size) ? i : best), 0);

/** Gold dust streaming off the grail card. Emission strength and position come from grailStore. */
export function GlitterCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(min-width: 768px) and (min-height: 501px) and (prefers-reduced-motion: no-preference)', () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const sprites = GOLDS.map(rgb => ({
        dust: DUST_RADII.map(r => sprite(rgb, r, false)),
        mote: MOTE_RADII.map(r => sprite(rgb, r, true)),
      }));
      const pool: Particle[] = [];
      const cap = () => (window.innerWidth < 768 ? 1000 : 2500);
      let carry = 0;
      let last = performance.now();
      let raf = 0;
      let visible = true;
      let w = 0;
      let h = 0;

      const resize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      // Observe the canvas itself, not the window: it is display:none (0×0) until the sequence starts.
      const ro = new ResizeObserver(resize);

      const frame = (t: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        if (!visible && pool.length === 0) return;
        const { rate, emitter } = grailStore.glitter;
        if (visible && emitter && rate > 0) {
          const n = emissionCount(rate, dt, cap(), carry);
          carry = n.carry;
          emit(pool, n.count, emitter, cap());
        }
        step(pool, dt);
        ctx.clearRect(0, 0, w, h);
        for (const p of pool) {
          const set = sprites[p.color];
          const img = p.mote ? set.mote[nearest(MOTE_RADII, p.size)] : set.dust[nearest(DUST_RADII, p.size)];
          ctx.globalAlpha = p.alpha * (1 - p.age / p.life);
          ctx.drawImage(img, p.x - img.width / 2, p.y - img.height / 2);
        }
        ctx.globalAlpha = 1;
      };

      resize();
      io.observe(canvas);
      ro.observe(canvas);
      raf = requestAnimationFrame(frame);
      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
      };
    });
    return () => media.revert();
  }, []);

  return <canvas ref={ref} aria-hidden data-glitter className={className} />;
}
