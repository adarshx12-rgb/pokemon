import type { ReactNode } from 'react';
import styles from './ds.module.css';

interface Props { layout: 'ds' | 'side'; top: ReactNode; bottom: ReactNode; testId: string }

/** The grey DS shell: top screen, hinge, bottom screen. 'side' puts the bottom screen to the right (below under 640px). */
export function DsConsole({ layout, top, bottom, testId }: Props) {
  return (
    <div className={styles.shell} data-layout={layout} data-testid={testId}>
      <div className={styles.screen}>{top}</div>
      <div className={styles.hinge} aria-hidden />
      <div className={`${styles.screen} ${styles.bottom}`}>{bottom}</div>
    </div>
  );
}
