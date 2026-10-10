'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WIPE_TO, WIPE_TO_DIAG, wipeFrom, type WipeDir } from '@/lib/manga/panel';

interface Props { children: React.ReactNode; dir?: WipeDir; className?: string; delay?: number; immediate?: boolean }

/** Wipes its panel in along `dir` and draws the ink frame, on scroll (or on mount when `immediate`). */
export function PanelReveal({ children, dir = 'left', className = '', delay = 0, immediate = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay, scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 85%' } });
      tl.fromTo(el, { clipPath: wipeFrom(dir) }, { clipPath: dir === 'diag' ? WIPE_TO_DIAG : WIPE_TO, duration: 0.9, ease: 'power3.inOut', clearProps: 'clipPath' });
      tl.fromTo(el.querySelectorAll('[data-ink-stroke]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5');
    }, el);
    return () => ctx.revert();
  }, [dir, delay, immediate]);
  return <div ref={ref} className={className}>{children}</div>;
}
