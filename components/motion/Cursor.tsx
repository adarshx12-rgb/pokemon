'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';

const subscribeNoop = () => () => {};
const wantsCustomCursor = () =>
  window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(subscribeNoop, wantsCustomCursor, () => false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    document.body.classList.add('has-cursor');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      el.style.opacity = '1';
      const target = e.target as Element | null;
      el.dataset.hover = target?.closest('a,button,input,select,[data-cursor]') ? 'true' : 'false';
    };
    window.addEventListener('pointermove', move);
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.classList.remove('has-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      data-hover="false"
      style={{ opacity: 0 }}
      className="pointer-events-none fixed left-0 top-0 z-[100] -ml-4 -mt-4 size-8 rounded-full border border-gold mix-blend-difference transition-[width,height,margin,background-color] duration-200 data-[hover=true]:-ml-7 data-[hover=true]:-mt-7 data-[hover=true]:size-14 data-[hover=true]:bg-gold/20"
    />
  );
}
