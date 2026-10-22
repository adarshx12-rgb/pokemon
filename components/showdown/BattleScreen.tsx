'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { TYPE_COLORS } from '@/data/typeColors';
import { createBattle } from '@/lib/battle/engine';
import { menuFor, type MenuState } from '@/lib/showdown/menu';
import { eventDelay } from '@/lib/battle/pacing';
import type { BattleEvent, EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, teamNames, type BattleView } from '@/lib/battle/view';
import { BottomScreen } from './ds/BottomScreen';
import { HpBox } from './ds/HpBox';
import dsStyles from './ds/ds.module.css';
import { DsConsole } from './ds/DsConsole';
import { TopScreen } from './ds/TopScreen';
import { TextBox } from './TextBox';
import { PokemonSprite } from './PokemonSprite';
import styles from './showdown.module.css';

type Fx = { key: number; kind: 'enter' | 'lunge' | 'hit' | 'faint'; side: Side; color?: string; strong?: boolean };

function fxFor(events: BattleEvent[], i: number): Fx | null {
  const e = events[i];
  if (e.kind === 'switchIn') return { key: i, kind: 'enter', side: e.side };
  if (e.kind === 'useMove') return { key: i, kind: 'lunge', side: e.side };
  if (e.kind === 'faint') return { key: i, kind: 'faint', side: e.side };
  if (e.kind === 'damage' && e.amount > 0) {
    const prev = events[i - 1];
    const color = prev?.kind === 'useMove' ? TYPE_COLORS[prev.move.type] : '#ffffff';
    return { key: i, kind: 'hit', side: e.side, color, strong: e.effectiveness > 1 || e.crit };
  }
  return null;
}

interface Props { teamA: TeamMember[]; teamB: TeamMember[]; seed: number; classic: boolean; onFinish: (end: EndEvent) => void; onEdit: () => void; onReset: () => void }

export function BattleScreen({ teamA, teamB, seed, classic, onFinish, onEdit, onReset }: Props) {
  const [battle] = useState(() => createBattle(teamA, teamB, seed));
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const names = useMemo(() => teamNames(teamA, teamB), [teamA, teamB]);
  const [view, setView] = useState<BattleView>(() => battle.initialEvents.reduce((v, e) => applyEvent(v, e, names), initView(teamA, teamB)));
  const [index, setIndex] = useState(0);
  const speed = 2;
  const reduced = !!useReducedMotion();
  const busy = useRef(false);
  const sequence = useRef(0);
  const [fx, setFx] = useState<Fx | null>(null); // latest effect, drives the screen flash
  const [sideFx, setSideFx] = useState<Record<Side, Fx | null>>({ A: null, B: null }); // latest effect per sprite
  const [turn, setTurn] = useState<{ side: Side }>(() => ({ side: battle.nextSide ?? 'A' }));
  const [menu, setMenu] = useState<MenuState>(() => menuFor({ replacing: !!battle.replacing, layout: 'ds' }));
  const playing = events.length > 0 && index <= events.length;
  const end = events.find((event): event is EndEvent => event.kind === 'end');

  useEffect(() => {
    if (!playing) return;
    const prev = index === 0 ? null : events[index - 1];
    const maxHp = prev && 'side' in prev && 'index' in prev ? view.maxHp[prev.side][prev.index] : undefined;
    const delay = prev ? eventDelay(prev, view.message, speed, maxHp, reduced) : 0;
    const t = setTimeout(() => {
      if (index === events.length) {
        // Playback is over: the menu serves whoever acts next (or must replace a fainted Pokémon).
        setTurn(t => ({ side: battle.replacing ?? battle.nextSide ?? t.side }));
        setMenu(menuFor({ replacing: !!battle.replacing, layout: 'ds' }));
        setIndex(i => i + 1);
        return;
      }
      setView(v => applyEvent(v, events[index], names));
      const effect = fxFor(events, index);
      const next = effect ? { ...effect, key: sequence.current++ } : null;
      setFx(next);
      if (next) setSideFx(s => ({ ...s, [next.side]: next }));
      setIndex(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [playing, index, speed, reduced, events, names, battle, view.message, view.maxHp]);

  useEffect(() => {
    if (!playing) busy.current = false;
  }, [playing]);

  // On phones the page header pushes the arena below the fold; start the battle with it in view.
  useEffect(() => {
    if (matchMedia('(max-width: 640px)').matches) document.querySelector('[data-testid="battle-stage"]')?.scrollIntoView({ block: 'start' });
  }, []);

  // Plays whatever the engine just produced; ignores empty (invalid) results.
  const play = (next: BattleEvent[]) => {
    if (busy.current || playing || end || !next.length) return;
    busy.current = true;
    setEvents(next);
    setIndex(0);
  };

  const animMs = `${450 / speed}ms`;

  const sprite = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    const team = side === 'A' ? teamA : teamB;
    const p = team[idx].pokemon;
    // The key only changes when this sprite gets a new effect, so idle sprites never replay an animation.
    const f = sideFx[side];
    const anim = view.fainted[side][idx] ? 'faint-drop'
      : f?.kind === 'enter' ? (side === 'A' ? 'slide-in-left' : 'slide-in-right')
      : f?.kind === 'lunge' ? (side === 'A' ? 'lunge-a' : 'lunge-b')
      : f?.kind === 'hit' ? (f.strong ? 'shake-strong' : 'shake')
      : null;
    return (
      <div key={`${side}-${idx}-${f?.key ?? 'none'}`} className="relative size-full"
        style={anim ? { animation: `${anim} ${animMs} ease-out both` } : undefined}>
        <PokemonSprite pokemon={p} side={side} classic={classic} />
      </div>
    );
  };

  const panel = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    return (
      <HpBox key={`${side}-${idx}`} name={names[side][idx]} hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers
        fainted={view.fainted[side]} side={side} />
    );
  };

  const turnSide = turn.side;
  const turnName = names[turnSide][view.active[turnSide] ?? 0];
  const prompt = !events.length ? `What will ${turnName} do? Choose a move.` : view.message;
  const member = (turnSide === 'A' ? teamA : teamB)[view.active[turnSide] ?? 0];
  const sideTeam = turnSide === 'A' ? teamA : teamB;

  return (
    <div className={styles.battle}>
      <DsConsole layout="ds" testId="battle-stage"
        top={<TopScreen player={sprite('A')} opponent={sprite('B')} playerBox={panel('A')} opponentBox={panel('B')}
          message={<TextBox key={view.messageId} message={prompt} speed={speed} />}
          overlay={fx?.kind === 'hit' && <div key={fx.key} aria-hidden className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: fx.color, animation: `hit-flash ${animMs} ease-out both` }} />} />}
        bottom={<>
          <BottomScreen side={turnSide} layout="ds" state={menu} onState={setMenu} member={member} team={sideTeam}
            hp={view.hp[turnSide]} maxHp={view.maxHp[turnSide]} fainted={view.fainted[turnSide]} active={view.active[turnSide]}
            ppLeft={view.pp[turnSide][view.active[turnSide] ?? 0]} disabled={playing || !!end}
            onMove={name => play(battle.playMove(turnSide, name))}
            onSwitch={i => play(battle.switchTo(turnSide, i))}
            onReplace={i => play(battle.replace(turnSide, i))}
            onRun={onEdit} />
          {end && !playing && <button type="button" className={dsStyles.result} onClick={() => onFinish(end)}>View result</button>}
          <div className={dsStyles.extras}>
            <button type="button" onClick={onReset}>Reset battle</button>
            <button type="button" onClick={onEdit}>Edit teams</button>
          </div>
        </>} />
      <p className={styles.battleHelp}>You control both teams. Use the touch screen to fight, switch or give up for whoever&rsquo;s turn it is; nothing happens until you choose.</p>
    </div>
  );
}
