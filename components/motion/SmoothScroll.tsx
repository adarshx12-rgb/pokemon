'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

let lenis: Lenis | null = null;

/** Scroll the page, through Lenis when it is running so the two never fight. */
export function scrollToY(y: number, immediate = false): void {
  if (lenis) lenis.scrollTo(y, { immediate });
  else window.scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
}

/**
 * Re-measure the page now. Lenis notices height changes only after a 250ms debounce, so right after the
 * home pin is added it would still clamp native and keyboard scrolls (End, focus) to the old page height.
 */
export function syncScrollSize(): void {
  lenis?.resize();
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const instance = new Lenis({ lerp: 0.1 });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);
  return <>{children}</>;
}
