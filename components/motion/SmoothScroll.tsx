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

/** Stop page inertia while a native dialog owns scrolling and focus. */
export function lockSmoothScroll(): () => void {
  const instance = lenis;
  const wasStopped = instance?.isStopped;
  instance?.stop();
  return () => { if (instance === lenis && !wasStopped) instance?.start(); };
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(min-width: 768px) and (min-height: 501px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const instance = new Lenis({ lerp: 0.085 });
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
    });
    return () => media.revert();
  }, []);
  return <>{children}</>;
}
