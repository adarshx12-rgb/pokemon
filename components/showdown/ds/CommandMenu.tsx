'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Side, TeamMember } from '@/lib/battle/types';
import { hpColor, whatWillDo } from '@/lib/battle/view';
import { displayName } from '@/lib/pokeapi/names';
import { battleCue, type Cue } from '@/lib/showdown/cues';
import { fightOptions, type MenuState } from '@/lib/showdown/menu';
import styles from './ds.module.css';

// Arrow keys move the cursor between the enabled options of a box, as on the game's D-pad.
function moveCursor(e: React.KeyboardEvent<HTMLElement>, cols: number) {
  const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols } as Record<string, number>)[e.key];
  if (!step) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
  const from = items.indexOf(document.activeElement as HTMLButtonElement);
  if (from < 0) return;
  e.preventDefault();
  for (let i = from + step; i >= 0 && i < items.length; i += step) if (!items[i].disabled) return items[i].focus();
}

/** A white option box with a ▶ cursor on the hovered or focused option. */
export function OptionBox({ cols = 1, className = '', children }: { cols?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`${styles.options} ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} onKeyDown={e => moveCursor(e, cols)}>
      {children}
    </div>
  );
}

interface Props {
  side: Side; name: string; state: MenuState; onState: (state: MenuState) => void;
  member: TeamMember; team: TeamMember[]; hp: number[]; maxHp: number[]; fainted: boolean[]; active: number | null; ppLeft: number[];
  onMove: (name: string) => void; onSwitch: (index: number) => void; onReplace: (index: number) => void; onRun: () => void;
}

/** The battle commands inside the text box, for the side whose turn it is (the party list fills the screen). */
export function CommandMenu({ side, name, state, onState, member, team, hp, maxHp, fainted, active, ppLeft, onMove, onSwitch, onReplace, onRun }: Props) {
  // Touch browsers can swallow the compatibility click after a scroll, so a completed touch tap acts on
  // pointerup; the click that may follow is then ignored (cleared again by the next pointerdown/key).
  const touched = useRef(false);
  const tap = (fn: () => void, cue: Cue = 'menuSelect') => {
    const act = () => { battleCue(cue); fn(); };
    return {
      onClick: () => { if (touched.current) { touched.current = false; return; } act(); },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType !== 'touch' || e.currentTarget.disabled) return;
        touched.current = true; act();
      },
    };
  };
  // The menu appears once a turn has played out and each submenu replaces the last, so the cursor (focus) lands on
  // its first option — the preselected slot when replacing — unless focus is somewhere else on the page.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const now = document.activeElement;
    if (!el || (now && now !== document.body && !el.contains(now))) return;
    const target = el.querySelector<HTMLButtonElement>('[data-selected="true"]:enabled') ?? el.querySelector<HTMLButtonElement>('button:enabled:not([data-testid="menu-back"])');
    target?.focus({ preventScroll: true });
  }, [state]);
  const [cursor, setCursor] = useState(0); // the move whose PP and type the Fight menu shows
  const options = fightOptions(member.moves, ppLeft);
  const shown = options[Math.min(cursor, options.length - 1)];
  const firstHealthy = team.findIndex((_, i) => !fainted[i] && i !== active);
  const back = (state === 'fight' || state === 'party' || state === 'run') ? () => { battleCue('menuBack'); onState('main'); } : null;
  const turn = <span className={styles.turnLabel} data-side={side} data-testid="turn-label">{side === 'A' ? 'YOUR TURN' : "RIVAL'S TURN"}</span>;

  const slots = (pick: (i: number) => void, replace: boolean) => (
    <OptionBox cols={2} className={styles.partyGrid}>
      {team.map((m, i) => {
        const out = !!fainted[i];
        const frac = maxHp[i] ? Math.max(0, hp[i] / maxHp[i]) : 0;
        const label = displayName(m.pokemon.name);
        const src = m.pokemon.sprites.front ?? m.pokemon.sprites.artwork;
        return (
          <button key={i} type="button" className={styles.slot} data-testid={`party-${side}-${i}`} data-selected={replace && i === firstHealthy}
            disabled={out || i === active} {...tap(() => pick(i))} aria-label={`${label}${out ? ' (fainted)' : i === active ? ' (in battle)' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src && <img src={src} alt="" draggable={false} />}
            <span className={styles.slotName}>{label.toUpperCase()}</span>
            <span className={styles.slotBar}><i data-color={hpColor(hp[i], maxHp[i])} style={{ width: `${frac * 100}%` }} /></span>
            <small>{out ? 'FAINTED' : `${hp[i]}/${maxHp[i]}`}</small>
          </button>
        );
      })}
    </OptionBox>
  );

  return (
    <div ref={root} className={styles.command} data-state={state}
      onPointerDown={() => { touched.current = false; }}
      onKeyDown={e => { touched.current = false; if (back && (e.key === 'Escape' || e.key === 'Backspace')) { e.preventDefault(); back(); } }}>
      {state === 'main' && <>
        <div className={styles.say}>{turn}<p aria-live="polite">{whatWillDo(name)}</p></div>
        <OptionBox cols={2}>
          <button type="button" className={styles.opt} data-testid="menu-fight" {...tap(() => onState('fight'))}>FIGHT</button>
          <button type="button" className={styles.opt} data-testid="menu-pokemon" {...tap(() => onState('party'))}>POKéMON</button>
          <button type="button" className={styles.opt} data-testid="menu-run" {...tap(() => onState('run'))}>RUN</button>
        </OptionBox>
      </>}
      {state === 'fight' && <>
        <OptionBox cols={2} className={styles.moves}>
          {options.map(({ move, pp, disabled }, i) => (
            <button key={move.name} type="button" className={styles.opt} data-testid={`move-${side}-${move.name}`} disabled={disabled}
              aria-label={`${displayName(move.name)}, ${move.type}, PP ${pp}/${move.pp ?? 5}`}
              onFocus={() => setCursor(i)} onMouseEnter={() => setCursor(i)} {...tap(() => onMove(move.name))}>
              {displayName(move.name).toUpperCase()}
            </button>
          ))}
        </OptionBox>
        <div className={styles.moveInfo} data-testid="fight-info">
          <span>PP <b>{shown.pp}/{shown.move.pp ?? 5}</b></span>
          <span>TYPE/{shown.move.type.toUpperCase()}</span>
          <button type="button" className={styles.backOpt} data-testid="menu-back" {...tap(back!, 'menuBack')}>BACK</button>
        </div>
      </>}
      {(state === 'party' || state === 'replace') && <div className={styles.partyScreen}>
        <div className={styles.partyHead}>{turn}<p aria-live="polite">{state === 'replace' ? 'Send out which Pokémon?' : 'Choose a Pokémon.'}</p>
          {state === 'party' && <button type="button" className={styles.backOpt} data-testid="menu-back" {...tap(back!, 'menuBack')}>CANCEL</button>}
        </div>
        {slots(state === 'replace' ? onReplace : onSwitch, state === 'replace')}
      </div>}
      {state === 'run' && <>
        <div className={styles.say}>{turn}<p aria-live="polite">Give up the battle?</p></div>
        <OptionBox>
          <button type="button" className={styles.opt} data-testid="run-yes" {...tap(onRun)}>YES</button>
          <button type="button" className={styles.opt} data-testid="run-no" {...tap(back!, 'menuBack')}>NO</button>
        </OptionBox>
      </>}
    </div>
  );
}
