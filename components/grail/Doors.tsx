import Image from 'next/image';
import Link from 'next/link';
import { GRAIL_FACES } from '@/lib/grail/assets';
import { ShowdownDevice } from './ShowdownDevice';
import styles from './grail.module.css';

/** The two exits from the home page. The grail card lands in the Vault door's slot at the end of the sequence. */
export function Doors() {
  return (
    <div className={styles.doorRow}>
      <Link href="/cards" className={styles.door} data-door="vault">
        <div className={styles.doorObj} data-door-card>
          <div className={styles.doorScale}>
            <div className={styles.vaultCard} data-vault-card>
              <Image src={GRAIL_FACES.front} alt="" fill sizes="(min-width: 768px) 270px, 160px" />
            </div>
          </div>
        </div>
        <p className="meta text-gold">01 — The collection</p>
        <h3 className={styles.doorWord}>Vault</h3>
        <span className="text-link">Enter the vault →</span>
      </Link>
      <Link href="/showdown" className={styles.door} data-door="showdown">
        <div className={styles.doorObj}>
          <div className={styles.doorScale}><ShowdownDevice /></div>
        </div>
        <p className="meta">02 — The arena</p>
        <h3 className={styles.doorWord}>Showdown</h3>
        <span className="text-link">Enter the arena →</span>
      </Link>
    </div>
  );
}
