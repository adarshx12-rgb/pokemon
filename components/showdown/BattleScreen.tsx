'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_COLORS } from '@/data/typeColors';
import { simulate } from '@/lib/battle/engine';
import { eventDelay } from '@/lib/battle/pacing';
import type { BattleEvent, EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, teamNames, type BattleView } from '@/lib/battle/view';
import { HpPanel } from './HpPanel';
import { TextBox } from './TextBox';
import { Arena } from './Arena';
import { PokemonSprite } from './PokemonSprite';
import styles from './showdown.module.css';

const SPEEDS = [1, 2, 4] as const;

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

interface Props { teamA: TeamMember[]; teamB: TeamMember[]; seed: number; classic: boolean; onFinish: (end: EndEvent) => void }

export function BattleScreen({ teamA, teamB, seed, classic, onFinish }: Props) {
  const events = useMemo(() => simulate(teamA, teamB, seed), [teamA, teamB, seed]);
  const names = useMemo(() => teamNames(teamA, teamB), [teamA, teamB]);
  const [view, setView] = useState<BattleView>(() => initView(teamA, teamB));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [fx, setFx] = useState<Fx | null>(null); // latest effect, drives the screen flash
  const [sideFx, setSideFx] = useState<Record<Side, Fx | null>>({ A: null, B: null }); // latest effect per sprite
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish(events[events.length - 1] as EndEvent);
  }, [events, onFinish]);

  useEffect(() => {
    if (!playing || index >= events.length) return;
    const delay = index === 0 ? 300 : eventDelay(events[index - 1].kind, view.message, speed);
    const t = setTimeout(() => {
      setView(v => applyEvent(v, events[index], names));
      const next = fxFor(events, index);
      setFx(next);
      if (next) setSideFx(s => ({ ...s, [next.side]: next }));
      setIndex(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [playing, index, speed, events, names, view.message]);

  useEffect(() => {
    if (index < events.length) return;
    const t = setTimeout(finish, 1500 / speed);
    return () => clearTimeout(t);
  }, [index, events.length, finish, speed]);

  const skip = () => {
    setView(v => events.slice(index).reduce((s, e) => applyEvent(s, e, names), v));
    setIndex(events.length);
    finish();
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
      <HpPanel name={names[side][idx]} hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers={side === 'A'}
        fainted={view.fainted[side]} />
    );
  };

  return (
    <div className={styles.battle}>
      <Arena player={sprite('A')} opponent={sprite('B')} playerPanel={panel('A')} opponentPanel={panel('B')}
        overlay={fx?.kind === 'hit' && <div key={fx.key} aria-hidden className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: fx.color, animation: `hit-flash ${animMs} ease-out both` }} />}
        dialogue={<TextBox key={view.messageId} message={view.message || 'The battle is about to begin…'} speed={speed} />}
        commands={<>
          <button type="button" onClick={() => setPlaying(p => !p)} disabled={index >= events.length}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" aria-label={`Battle speed ${speed} times. Increase speed`} onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}>Speed {speed}×</button>
          <button type="button" data-testid="skip" onClick={skip}>Result</button>
          <span className="self-center text-center text-[9px] opacity-60">Auto battle</span>
        </>} />
      <p className={styles.battleHelp}>Your lineup is locked. Stats, speed, and type matchups take it from here.</p>
    </div>
  );
}
