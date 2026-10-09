'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// The parent remounts this with key={messageId}, so every new message types out from the start.
export function TextBox({ message, speed }: { message: string; speed: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= message.length) return;
    const t = setTimeout(() => setShown(s => s + 1), (reduce ? 8 : 28) / speed);
    return () => clearTimeout(t);
  }, [shown, message, speed, reduce]);

  return (
    <div className="border-gold-frame relative h-full rounded-2xl bg-ink/95 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-gold/30" />
      <p aria-hidden className="font-pixel text-[10px] leading-loose sm:text-sm sm:leading-[2.2]">{message.slice(0, shown)}</p>
      <p className="sr-only" aria-live="polite">{message}</p>
    </div>
  );
}
