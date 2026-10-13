import type { ReactNode } from 'react';
import styles from './showdown.module.css';

interface Props {
  player?: ReactNode;
  opponent?: ReactNode;
  playerPanel?: ReactNode;
  opponentPanel?: ReactNode;
  dialogue: ReactNode;
  commands: ReactNode;
  overlay?: ReactNode;
  preview?: boolean;
}

export function Arena({ player, opponent, playerPanel, opponentPanel, dialogue, commands, overlay, preview }: Props) {
  return (
    <div className={styles.screenFrame} data-testid={preview ? 'arena-preview' : 'battle-stage'}>
      <div className={styles.screenLabel}><span>HIPOKÉMON</span><span>{preview ? 'Team selection' : 'Battle in progress'}</span></div>
      <div className={styles.screen}>
        <div className={styles.field}>
          <div className={styles.farPlatform} aria-hidden />
          <div className={styles.nearPlatform} aria-hidden />
          {!player && !opponent && preview && <p className={styles.emptyField}>Your next rivalry<br />starts here.</p>}
          <div className={styles.opponentPanel}>{opponentPanel}</div>
          <div className={styles.opponentSprite}>{opponent}</div>
          <div className={styles.playerSprite}>{player}</div>
          <div className={styles.playerPanel}>{playerPanel}</div>
          {overlay}
        </div>
        <div className={styles.console}>
          <div className={styles.dialogue}>{dialogue}</div>
          <div className={styles.commands}>{commands}</div>
        </div>
      </div>
      <div className={styles.screenFoot}><span className={styles.powerLight} /> Level 50 • Stats battle <span className={styles.speaker} aria-hidden>▥ ▥ ▥</span></div>
    </div>
  );
}
