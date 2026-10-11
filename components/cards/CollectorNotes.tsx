import { collectorInfo } from '@/lib/tcg/collector';
import type { Card } from '@/lib/tcg/types';
import styles from './collector.module.css';

export function CollectorNotes({ card, compact = false }: { card: Card; compact?: boolean }) {
  const { note } = collectorInfo(card);
  return (
    <section className={`${styles.notes} ${compact ? styles.compactNotes : ''}`} data-testid="collector-notes" aria-label={`Collector notes for ${card.name}`}>
      <h3 className={styles.notesTitle}>Collector’s notes</h3>
      <p className={styles.appeal}>{note.appeal}</p>
      <dl className={styles.noteDetails}>
        <div><dt>Before you collect</dt><dd>{note.check}</dd></div>
        <div><dt>A collection idea</dt><dd>{note.collect}</dd></div>
      </dl>
    </section>
  );
}
