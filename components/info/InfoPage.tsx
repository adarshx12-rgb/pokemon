import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './info.module.css';

export function InfoPage({ title, intro, updated, children }: { title: string; intro: string; updated?: boolean; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Back to Pokéfame</Link>
        <h1>{title}</h1>
        <p>{intro}</p>
        {updated && <p className={styles.date}>Last updated: October 13, 2026</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </main>
  );
}
