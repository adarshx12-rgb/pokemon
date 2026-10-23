'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CHAR_MS } from '@/lib/battle/pacing';
import styles from './showdown.module.css';

// The parent remounts this with key={messageId}, so every new message types out from the start.
export function TextBox({ message, speed }: { message: string; speed: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= message.length) return;
    const t = setTimeout(() => setShown(s => s + 1), (reduce ? 8 : CHAR_MS) / speed);
    return () => clearTimeout(t);
  }, [shown, message, speed, reduce]);

  return (
    <div className={styles.textBox}>
      <p aria-hidden>{reduce ? message : message.slice(0, shown)}</p>
      <p className="sr-only" aria-live="polite">{message}</p>
    </div>
  );
}
