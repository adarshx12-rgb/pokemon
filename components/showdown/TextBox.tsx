'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CHAR_MS } from '@/lib/battle/pacing';
import styles from './showdown.module.css';

// The parent remounts this with key={messageId}, so every new message types out from the start. `complete` shows it all at once.
export function TextBox({ message, speed, complete = false }: { message: string; speed: number; complete?: boolean }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (complete || shown >= message.length) return;
    const t = setTimeout(() => setShown(s => s + 1), (reduce ? 8 : CHAR_MS) / speed);
    return () => clearTimeout(t);
  }, [shown, message, speed, reduce, complete]);

  return (
    <div className={styles.textBox}>
      <p aria-hidden>{reduce || complete ? message : message.slice(0, shown)}</p>
      <p className="sr-only" aria-live="polite">{message}</p>
    </div>
  );
}
