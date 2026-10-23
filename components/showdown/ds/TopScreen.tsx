import type { ReactNode } from 'react';
import styles from './ds.module.css';

interface Props {
  player?: ReactNode;
  opponent?: ReactNode;
  playerBox?: ReactNode;
  opponentBox?: ReactNode;
  message: ReactNode;
  overlay?: ReactNode;
  onAdvance?: () => void;
  intro?: boolean; // the platforms slide in
}

/** The DS top screen: HGSS-style battle scene with the red-framed text box along the bottom. */
export function TopScreen({ player, opponent, playerBox, opponentBox, message, overlay, onAdvance, intro = false }: Props) {
  // Enter or Space advances the text like a click.
  const key = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); onAdvance?.();
  };
  return (
    <div className={styles.top} data-intro={intro || undefined}>
      <div className={`${styles.platform} ${styles.far}`} aria-hidden />
      <div className={`${styles.platform} ${styles.near}`} aria-hidden />
      <div className={styles.opponentBox}>{opponentBox}</div>
      <div className={styles.foeSprite}>{opponent}</div>
      <div className={styles.meSprite}>{player}</div>
      <div className={styles.playerBox}>{playerBox}</div>
      {overlay}
      <div className={styles.textBox} data-testid="text-box" onClick={onAdvance} {...(onAdvance && { role: 'button', tabIndex: 0, onKeyDown: key })}>{message}</div>
    </div>
  );
}
