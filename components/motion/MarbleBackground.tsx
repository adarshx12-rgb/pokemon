'use client';
import { useEffect, useRef } from 'react';
import { layerSize, parallaxOffset } from '@/lib/parallax';

const ASPECT = 2700 / 1600; // height / width of public/marble.webp
const MAX_FACTOR = 0.3;

/** Fixed black-and-gold marble layer that drifts up at up to 30% of scroll speed. */
export function MarbleBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let layerH = 0;

    const update = () => {
      raf = 0;
      const y = reduce ? 0 : parallaxOffset({
        scrollY: window.scrollY,
        docH: document.documentElement.scrollHeight,
        viewportH: window.innerHeight,
        layerH,
        maxFactor: MAX_FACTOR,
      });
      el.style.transform = `translate3d(-50%, ${y}px, 0)`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    const layout = () => {
      const size = layerSize(window.innerWidth, window.innerHeight, ASPECT);
      layerH = size.height;
      el.style.width = `${size.width}px`;
      el.style.height = `${size.height}px`;
      update();
    };

    layout();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', layout);
    // Page height changes after navigation and as images load, which changes the drift speed.
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', layout);
      ro.disconnect();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        ref={ref}
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
        className="absolute left-1/2 top-0 h-[169vw] w-screen bg-[url(/marble-sm.webp)] bg-cover bg-top opacity-45 will-change-transform md:bg-[url(/marble.webp)]"
      />
      {/* Darkens the centre less than the edges, so gold veins frame the content without fighting the text. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.35),rgba(10,10,10,0.8))]" />
    </div>
  );
}
