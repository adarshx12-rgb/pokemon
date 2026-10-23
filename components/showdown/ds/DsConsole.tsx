import type { ReactNode } from 'react';
import styles from './ds.module.css';

interface Props { top: ReactNode; testId: string }

/** The grey console frame around the battle screen. */
export function DsConsole({ top, testId }: Props) {
  return (
    <div className={styles.shell} data-testid={testId}>
      <div className={styles.screen}>{top}</div>
    </div>
  );
}
