'use client';
import { useState, useSyncExternalStore } from 'react';
import styles from './collector.module.css';

const CHANGE = 'vault-collection-change';
const keyFor = (id: string) => `pokemon-vault:collection:${id}`;
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE, callback);
  };
}
function read(id: string): number {
  try {
    const value = Number(localStorage.getItem(keyFor(id)));
    return Number.isInteger(value) && value >= 0 && value <= 3 ? value : 0;
  } catch { return 0; }
}
const serverSnapshot = () => 0;

export function CollectionControls({ id }: { id: string }) {
  const flags = useSyncExternalStore(subscribe, () => read(id), serverSnapshot);
  const [error, setError] = useState(false);
  const toggle = (bit: number) => {
    try {
      localStorage.setItem(keyFor(id), String(read(id) ^ bit));
      window.dispatchEvent(new Event(CHANGE));
      setError(false);
    } catch { setError(true); }
  };
  return (
    <div className={styles.collection}>
      <div className={styles.actions} role="group" aria-label="Your collection">
        <button type="button" aria-pressed={!!(flags & 1)} onClick={() => toggle(1)}>{flags & 1 ? '✓ In my collection' : '+ I own this'}</button>
        <button type="button" aria-pressed={!!(flags & 2)} onClick={() => toggle(2)}>{flags & 2 ? '✓ On my wishlist' : '+ Add to wishlist'}</button>
      </div>
      <p className={styles.storageNote} aria-live="polite">{error ? 'Could not save. Allow site storage in your browser and try again.' : 'Saved in this browser. You can mark a card as owned and wanted.'}</p>
    </div>
  );
}
