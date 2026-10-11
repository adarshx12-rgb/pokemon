'use client';
import Link from 'next/link';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Card } from '@/lib/tcg/types';
import { lockSmoothScroll } from '@/components/motion/SmoothScroll';
import { CardDetails } from './CardDetails';
import { CardInspector } from './CardInspector';
import styles from './collector.module.css';

const OpenCard = createContext<((card: Card) => void) | null>(null);

/** Preserve real links for no-JS, new-tab and bookmarked card pages. */
export function CardOpenLink({ card, children, className, tile = false }: { card: Card; children: React.ReactNode; className?: string; tile?: boolean }) {
  const open = useContext(OpenCard);
  return <Link href={`/cards/${card.id}`} prefetch={false} className={className} data-testid={tile ? 'card-tile' : undefined}
    aria-haspopup={open ? 'dialog' : undefined}
    onClick={event => {
      if (!open || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(card);
    }}>{children}</Link>;
}

export function VaultBrowser({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Card | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!selected || !dialog.current) return;
    const node = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.documentElement.style.overflow;
    const unlock = lockSmoothScroll();
    node.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      node.close();
      document.documentElement.style.overflow = previousOverflow;
      unlock();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [selected]);
  return (
    <OpenCard.Provider value={setSelected}>
      {children}
      <dialog ref={dialog} className={styles.window} aria-labelledby="vault-card-title" data-lenis-prevent
        onClose={() => setSelected(null)}
        onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        {selected && <div className={styles.windowBody}>
          <div className={styles.windowBar}>
            <span>Inside the Vault</span>
            <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close card details">Close <span aria-hidden>×</span></button>
          </div>
          <div className={styles.windowContent}>
            <CardInspector key={selected.id} card={selected} compact>
              <CardDetails card={selected} headingId="vault-card-title" modal />
              <Link href={`/cards/${selected.id}`} className={styles.permalink} onClick={() => dialog.current?.close()}>Open dedicated card page ↗</Link>
            </CardInspector>
          </div>
        </div>}
      </dialog>
    </OpenCard.Provider>
  );
}
