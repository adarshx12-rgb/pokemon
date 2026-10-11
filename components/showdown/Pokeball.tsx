import styles from './showdown.module.css';

export function Pokeball({ filled = false, fainted = false }: { filled?: boolean; fainted?: boolean }) {
  return <span aria-hidden className={`${styles.ball} ${filled ? styles.ballFilled : ''} ${fainted ? styles.ballFainted : ''}`} />;
}
