import type { CSSProperties } from 'react';
import type { Side, TypeName } from '@/lib/battle/types';
import { TYPE_FX, type FxStyle } from '@/lib/showdown/fx';
import styles from './fx.module.css';

const Shape = ({ type }: { type: TypeName }) => <i className={`${styles.shape} ${styles[TYPE_FX[type].shape]}`} />;

const Impact = ({ type }: { type: TypeName }) => (
  <div className={`${styles.target} ${styles.impact}`}>
    <i className={styles.ring} />
    <i className={styles.spark} />
    {[0, 60, 120, 180, 240, 300].map(a => (
      <span key={a} className={styles.burst} style={{ '--a': `${a}deg` } as CSSProperties}><Shape type={type} /></span>
    ))}
  </div>
);

/** A move's effect on the top screen. Contact and projectile go from `from` to the other side; stat styles play on `from`. */
export function BattleFx({ style, type, from }: { style: FxStyle; type: TypeName; from: Side }) {
  const vars = { '--c': TYPE_FX[type].color } as CSSProperties;
  if (style === 'stat-up' || style === 'stat-down') {
    return (
      <div aria-hidden className={styles.layer} data-from={from} data-testid="battle-fx" data-style={style}>
        <div className={`${styles.on} ${style === 'stat-up' ? styles.statUp : styles.statDown}`}>
          <i className={styles.glow} />
          <i className={styles.arrow} /><i className={styles.arrow} /><i className={styles.arrow} />
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden className={`${styles.layer} ${styles[style]}`} data-from={from} style={vars} data-testid="battle-fx" data-style={style}>
      {style === 'projectile' && (
        <div className={`${styles.track} ${styles.flyOut}`}>
          {[0, 1, 2].map(n => <div key={n} className={`${styles.track} ${styles.fly}`}><div className={styles.at}><Shape type={type} /></div></div>)}
        </div>
      )}
      <Impact type={type} />
    </div>
  );
}

/** The Poké Ball arcing onto `side`'s platform. */
export function BallThrow({ side }: { side: Side }) {
  return (
    <div aria-hidden className={styles.layer} data-testid={`pokeball-throw-${side}`}>
      <div className={styles.ballX} data-side={side}>
        <div className={styles.ballY}><div className={styles.ballAt}><i className={styles.ball} /></div></div>
      </div>
    </div>
  );
}

/** The white flash as the ball opens on `side`. */
export function OpenFlash({ side }: { side: Side }) {
  return <div aria-hidden className={styles.layer} data-from={side}><div className={styles.on}><i className={styles.openFlash} /></div></div>;
}

export function IntroFlash() {
  return <div aria-hidden className={styles.introFlash} />;
}
