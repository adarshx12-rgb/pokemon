'use client';
import { TYPE_COLORS } from '@/data/typeColors';
import type { Side, TeamMember } from '@/lib/battle/types';
import { hpColor } from '@/lib/battle/view';
import { displayName } from '@/lib/pokeapi/names';
import { fightOptions, type MenuState } from '@/lib/showdown/menu';
import styles from './ds.module.css';

interface Props {
  side: Side; layout: 'ds' | 'side'; state: MenuState; onState: (state: MenuState) => void;
  member: TeamMember; team: TeamMember[]; hp: number[]; maxHp: number[]; fainted: boolean[]; active: number | null; ppLeft: number[];
  onMove: (name: string) => void; onSwitch: (index: number) => void; onReplace: (index: number) => void; onRun: () => void;
  disabled: boolean;
}

/** The DS touch screen: whichever menu fits the current state, always for the side whose turn it is. */
export function BottomScreen({ side, layout, state, onState, member, team, hp, maxHp, fainted, active, ppLeft, onMove, onSwitch, onReplace, onRun, disabled }: Props) {
  // Side layout has no main menu: the Fight menu is always open.
  const shown = layout === 'side' && state === 'main' ? 'fight' : state;
  const options = fightOptions(member.moves, ppLeft);
  const firstHealthy = team.findIndex((_, i) => !fainted[i] && i !== active);

  const slots = (pick: (i: number) => void, replace: boolean) => (
    <div className={styles.partyGrid}>
      {team.map((m, i) => {
        const out = !!fainted[i];
        const frac = maxHp[i] ? Math.max(0, hp[i] / maxHp[i]) : 0;
        const name = displayName(m.pokemon.name);
        const src = m.pokemon.sprites.front ?? m.pokemon.sprites.artwork;
        return (
          <button key={i} type="button" className={styles.slot} data-testid={`party-${side}-${i}`} data-selected={replace && i === firstHealthy}
            disabled={disabled || out || i === active} onClick={() => pick(i)} aria-label={`${name}${out ? ' (fainted)' : i === active ? ' (in battle)' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src && <img src={src} alt="" draggable={false} />}
            <span className={styles.slotName}>{name}</span>
            <span className={styles.slotBar}><i data-color={hpColor(hp[i], maxHp[i])} style={{ width: `${frac * 100}%` }} /></span>
            <small>{out ? 'FAINTED' : `${hp[i]}/${maxHp[i]}`}</small>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={styles.menu} data-side={side} data-state={shown}>
      <h3 className={styles.turnLabel} data-testid="turn-label">{side === 'A' ? 'YOUR TURN' : "RIVAL'S TURN"}</h3>
      {shown === 'main' && <div className={styles.mainMenu}>
        <button type="button" className={styles.fightBtn} data-testid="menu-fight" disabled={disabled} onClick={() => onState('fight')}>FIGHT</button>
        <button type="button" className={`${styles.smallBtn} ${styles.pokeBtn}`} data-testid="menu-pokemon" disabled={disabled} onClick={() => onState('party')}>POKéMON</button>
        <button type="button" className={`${styles.smallBtn} ${styles.runBtn}`} data-testid="menu-run" disabled={disabled} onClick={() => onState('run')}>RUN</button>
      </div>}
      {shown === 'fight' && <>
        <div className={styles.moveGrid}>
          {options.map(({ move, pp, disabled: empty }) => (
            <button key={move.name} type="button" className={styles.moveBtn} data-testid={`move-${side}-${move.name}`}
              style={{ background: TYPE_COLORS[move.type] }} disabled={disabled || empty} onClick={() => onMove(move.name)}>
              <strong>{displayName(move.name).toUpperCase()}</strong>
              <span>{move.type.toUpperCase()}</span>
              <small>PP {pp}/{move.pp}</small>
            </button>
          ))}
        </div>
        {layout === 'ds' && <button type="button" className={styles.backBtn} data-testid="menu-back" disabled={disabled} onClick={() => onState('main')}>BACK</button>}
      </>}
      {shown === 'party' && <>
        {slots(onSwitch, false)}
        <button type="button" className={styles.backBtn} data-testid="menu-back" disabled={disabled} onClick={() => onState('main')}>BACK</button>
      </>}
      {shown === 'replace' && <>
        <p className={styles.prompt}>Send out which Pokémon?</p>
        {slots(onReplace, true)}
      </>}
      {shown === 'run' && <div className={styles.runConfirm}>
        <p className={styles.prompt}>Give up the battle?</p>
        <div>
          <button type="button" className={`${styles.smallBtn} ${styles.runBtn}`} data-testid="run-yes" disabled={disabled} onClick={onRun}>YES</button>
          <button type="button" className={`${styles.smallBtn} ${styles.pokeBtn}`} data-testid="run-no" disabled={disabled} onClick={() => onState('main')}>NO</button>
        </div>
      </div>}
    </div>
  );
}
