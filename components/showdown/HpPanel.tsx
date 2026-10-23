'use client';
import { MegaStone } from './MegaStone';
import { Pokeball } from './Pokeball';
import { useHpDrain } from './useHpDrain';
import styles from './showdown.module.css';

interface Props { name: string; hp: number; maxHp: number; showNumbers: boolean; fainted: boolean[]; mega?: boolean }

export function HpPanel({ name, hp, maxHp, showNumbers, fainted, mega = false }: Props) {
  // The bar and number drain towards the new HP at a steady rate, as in the games; the progressbar reports the real value.
  const shown = useHpDrain(hp, maxHp);
  const pct = maxHp ? shown / maxHp : 0;
  const color = pct > 0.5 ? '#53c997' : pct > 0.2 ? '#dfb440' : '#d95959';
  return (
    <div className={styles.hpPanel}>
      <div className={styles.hpHeading}><span>{mega && <MegaStone size={14} />}{name}</span><span>Lv.50</span></div>
      <div className={styles.hpRow}>
        <span>HP</span>
        <div className={styles.hpTrack}>
          <div role="progressbar" aria-label={`${name} HP`} aria-valuenow={hp} aria-valuemin={0} aria-valuemax={maxHp}
            className={styles.hpFill} style={{ width: `${pct * 100}%`, backgroundColor: color }} />
        </div>
      </div>
      <div className={styles.hpFooter}>
        <div className={styles.remaining} aria-label={`${fainted.filter(f => !f).length} of ${fainted.length} Pokémon remaining`}>
          {Array.from({ length: 6 }, (_, i) => <Pokeball key={i} filled={i < fainted.length} fainted={fainted[i]} />)}
        </div>
        {showNumbers && <span>{Math.ceil(shown)} / {maxHp}</span>}
      </div>
    </div>
  );
}
