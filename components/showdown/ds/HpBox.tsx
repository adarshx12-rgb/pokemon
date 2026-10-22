'use client';
import { hpColor } from '@/lib/battle/view';
import type { Side } from '@/lib/battle/types';
import { useHpDrain } from './useHpDrain';
import styles from './ds.module.css';

interface Props { name: string; hp: number; maxHp: number; showNumbers: boolean; fainted: boolean[]; side: Side }

export function HpBox({ name, hp, maxHp, showNumbers, fainted, side }: Props) {
  const shown = useHpDrain(hp, maxHp);
  const pct = maxHp ? Math.max(0, Math.min(1, shown / maxHp)) : 0;
  const left = fainted.filter(f => !f).length;
  // The foe's number stays out of sight (as in the games) but is still readable by assistive tech.
  const numberClass = side === 'A' ? styles.hpNumber : 'sr-only';
  return (
    <div className={`${styles.hpBox} ${side === 'A' ? styles.hpBoxPlayer : styles.hpBoxFoe}`} data-testid={`hp-box-${side}`}>
      <div className={styles.hpHeading}><span>{name}</span><span>Lv50</span></div>
      <div className={styles.hpBar}>
        <span>HP</span>
        <div className={styles.hpTrack}>
          <div role="progressbar" aria-label={`${name} HP`} aria-valuenow={hp} aria-valuemin={0} aria-valuemax={maxHp}
            className={styles.hpFill} data-color={hpColor(shown, maxHp)} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
      {showNumbers && <div className={numberClass} data-testid={`hp-number-${side}`}>{Math.ceil(shown)}{side === 'A' ? ` / ${maxHp}` : ''}</div>}
      {side === 'A' && <div className={styles.exp} aria-hidden><em /></div>}
      <div className={styles.party} role="img" aria-label={`${left} of ${fainted.length} Pokémon remaining`}>
        {fainted.map((f, i) => <i key={i} data-fainted={f} />)}
      </div>
    </div>
  );
}
