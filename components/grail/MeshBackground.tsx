'use client';
import { useEffect, useRef } from 'react';
import { GRID, projectGrid, type MeshPoint } from '@/lib/grail/mesh';
import { grailStore } from '@/lib/grail/store';

const FRAME_MS = 1000 / 30;
const BUCKETS = 10;

/** Fixed indigo wire-mesh walls on both sides of every page. Pages shape it through grailStore. */
export function MeshBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = -Infinity;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (timeMs: number) => {
      const mobile = w < 768;
      const shape = mobile ? { ...grailStore.mesh, open: Math.max(grailStore.mesh.open, 0.55) } : grailStore.mesh;
      const grid = projectGrid(shape, timeMs / 1000, w, h, grailStore.light);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = mobile ? 0.6 : 1;

      // Lines batched by alpha bucket: ~10 strokes per frame instead of ~4,400.
      const paths = Array.from({ length: BUCKETS }, () => new Path2D());
      const add = (a: MeshPoint, b: MeshPoint) => {
        const alpha = Math.min(a.alpha, b.alpha);
        if (alpha < 0.02) return;
        const path = paths[Math.min(BUCKETS - 1, Math.floor(alpha * BUCKETS))];
        path.moveTo(a.x, a.y);
        path.lineTo(b.x, b.y);
      };
      for (let r = 0; r < GRID.rows; r++) {
        for (let c = 0; c < GRID.cols; c++) {
          if (c < GRID.cols - 1) add(grid[r][c], grid[r][c + 1]);
          if (r < GRID.rows - 1) add(grid[r][c], grid[r + 1][c]);
        }
      }
      ctx.lineWidth = 0.9;
      paths.forEach((path, i) => {
        ctx.strokeStyle = `rgba(74, 77, 255, ${Math.min(1, ((i + 0.5) / BUCKETS) * 1.1)})`;
        ctx.stroke(path);
      });

      for (const row of grid) {
        for (const p of row) {
          if (p.alpha < 0.05) continue;
          ctx.fillStyle = p.lit > 0.15
            ? `rgba(255, 226, 150, ${Math.min(1, p.alpha * 0.9 + p.lit)})`
            : `rgba(124, 120, 255, ${Math.min(1, p.alpha * 1.2)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3 + p.alpha * 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      draw(t);
    };
    const start = () => { cancelAnimationFrame(raf); if (!reduce && !document.hidden) raf = requestAnimationFrame(loop); };
    const onResize = () => { resize(); if (reduce) draw(0); };

    resize();
    if (reduce) draw(0);
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', start);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 size-full" />;
}
