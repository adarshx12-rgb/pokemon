import styles from './grail.module.css';

const emptySlots = Array.from({ length: 6 }, (_, i) => <b key={i} />);

/** A card-sized Game Boy with an empty battle screen: a preview of the Showdown page. Decorative. */
export function ShowdownDevice() {
  return (
    <div className={styles.gb} aria-hidden>
      <div className={styles.screen}>
        <div className={styles.hp} style={{ left: 10, top: 12 }}>RIVAL<div className={styles.bar}><i style={{ width: '100%' }} /></div></div>
        <div className={styles.balls} style={{ left: 12, top: 52 }}>{emptySlots}</div>
        <div className={styles.plat} style={{ right: 16, top: 80 }} />
        <div className={styles.plat} style={{ left: 16, top: 150 }} />
        <div className={styles.hp} style={{ right: 10, top: 132 }}>YOU<div className={styles.bar}><i style={{ width: '100%' }} /></div></div>
        <div className={styles.balls} style={{ right: 12, top: 172 }}>{emptySlots}</div>
        <div className={styles.textBox}>
          BUILD YOUR<br />TEAM OF SIX.
          <div className={styles.menu}>▶ADD<br />&nbsp;RANDOM</div>
        </div>
      </div>
      <div className={styles.base}>
        <span className={styles.gbLogo}>SHOWDOWN</span>
        <span className={styles.btns}><span /><span /></span>
      </div>
    </div>
  );
}
