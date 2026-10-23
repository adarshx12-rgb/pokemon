'use client';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { drainMs, FULL_DRAIN_MS } from '@/lib/battle/pacing';

/** Follows `target` at a constant rate (a full bar in FULL_DRAIN_MS); jumps when `skip` is set or reduced motion would make the drain exceed 300ms. */
export function useHpDrain(target: number, maxHp: number, skip = false): number {
  const reduced = !!useReducedMotion();
  const [shown, setShown] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (current.current === target) return;
    const jump = skip || (reduced && drainMs(Math.abs(current.current - target), maxHp) > 300);
    const perMs = maxHp / FULL_DRAIN_MS;
    let last: number | null = null;
    let frame = 0;
    const step = (now: number) => {
      const dt = last === null ? 0 : now - last;
      last = now;
      const from = current.current;
      const next = jump ? target : from < target ? Math.min(target, from + perMs * dt) : Math.max(target, from - perMs * dt);
      current.current = next;
      setShown(next);
      if (next !== target) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, maxHp, reduced, skip]);

  return shown;
}
