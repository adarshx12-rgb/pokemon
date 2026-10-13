import Image from 'next/image';
import { GRAIL_FACES } from '@/lib/grail/assets';
import styles from './grail.module.css';

const SIZES = '(min-width: 768px) 310px, 62vw';

/** The grail card in CSS 3D. Decorative: the section's text carries the name, set and price. */
export function GrailCard({ flipped = false }: { flipped?: boolean }) {
  return (
    <div className={styles.card} data-grail-card data-flipped={flipped} aria-hidden>
      <div className={`${styles.edge} ${styles.edgeL}`} />
      <div className={`${styles.edge} ${styles.edgeR}`} />
      <div className={`${styles.face} ${styles.front}`}>
        <Image src={GRAIL_FACES.front} alt="" fill sizes={SIZES} loading="eager" />
      </div>
      <div className={`${styles.face} ${styles.back}`}>
        <Image src={GRAIL_FACES.back} alt="" fill sizes={SIZES} loading="eager" fetchPriority="low" />
      </div>
    </div>
  );
}
