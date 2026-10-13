'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_COLORS } from '@/data/typeColors';
import { createBattle } from '@/lib/battle/engine';
import { STRUGGLE } from '@/lib/battle/moves';
import { displayName } from '@/lib/pokeapi/names';
import { eventDelay } from '@/lib/battle/pacing';
import type { BattleEvent, EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, teamNames, type BattleView } from '@/lib/battle/view';
import { HpPanel } from './HpPanel';
import { TextBox } from './TextBox';
import { Arena } from './Arena';
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
  const busy = useRef(false);
  const sequence = useRef(0);
  const [fx, setFx] = useState<Fx | null>(null); // latest effect, drives the screen flash
  const [sideFx, setSideFx] = useState<Record<Side, Fx | null>>({ A: null, B: null }); // latest effect per sprite
  const playing = events.length > 0 && index <= events.length;
  const end = events.find((event): event is EndEvent => event.kind === 'end');

  useEffect(() => {
    if (!playing) return;
    const delay = index === 0 ? 0 : eventDelay(events[index - 1].kind, view.message, speed);
    const t = setTimeout(() => {
      if (index === events.length) {
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
  }, [playing, index, speed, events, names, view.message]);

  useEffect(() => {
    if (!playing) busy.current = false;
  }, [playing]);

  const attack = (side: Side, moveName: string) => {
    if (busy.current || playing || end) return;
    const next = battle.playMove(side, moveName);
    if (!next.length) return;
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
      <HpPanel name={names[side][idx]} hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers
        fainted={view.fainted[side]} />
    );
  };

  const nextSide = battle.nextSide;
  const nextName = nextSide ? names[nextSide][view.active[nextSide] ?? 0] : '';
  const prompt = !events.length ? `What will ${nextName} do? Choose a move.` : view.message;

  return (
    <div className={styles.battle}>
      <Arena player={sprite('A')} opponent={sprite('B')} playerPanel={panel('A')} opponentPanel={panel('B')}
        overlay={fx?.kind === 'hit' && <div key={fx.key} aria-hidden className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: fx.color, animation: `hit-flash ${animMs} ease-out both` }} />}
        dialogue={<div>
          <TextBox key={view.messageId} message={prompt} speed={speed} />
          {!playing && !end && <p className={styles.turnPrompt} data-testid="turn-prompt">Turn {battle.turn} · {nextSide === 'A' ? 'Your' : 'Opponent'} {nextName}: choose a move.</p>}
        </div>}
        commands={<>
          {(['A', 'B'] as const).map(side => {
            const idx = view.active[side] ?? 0;
            const member = (side === 'A' ? teamA : teamB)[idx];
            const moves = member.moves.length ? member.moves : [STRUGGLE];
            const ready = !playing && !end && nextSide === side;
            return <section key={side} className={styles.moveMenu} aria-label={`${side === 'A' ? 'Your' : 'Opponent'} ${displayName(member.pokemon.name)} moves`} data-active={ready}>
              <h2><span>{side === 'A' ? 'Your' : 'Opponent'} {displayName(member.pokemon.name)}</span><small>{ready ? 'Choose a move' : playing ? 'Playing move…' : end ? 'Battle over' : 'Waiting'}</small></h2>
              <div className={styles.moveButtons}>
                {moves.map(move => <button key={move.name} type="button" data-testid={`move-${side}-${move.name}`} disabled={!ready}
                  onClick={() => attack(side, move.name)}
                  onPointerUp={event => {
                    // Touch browsers can consume the compatibility click after scrolling.
                    // A pan cancels the pointer; a completed tap plays the move immediately.
                    if (event.pointerType === 'touch' && ready) attack(side, move.name);
                  }} style={{ borderLeftColor: TYPE_COLORS[move.type] }}>
                  <strong>{displayName(move.name)}</strong>
                  <span>{displayName(move.type)} · {move.damageClass}</span>
                  <small>Power {move.power} · Accuracy {move.accuracy === null ? '—' : `${move.accuracy}%`}</small>
                </button>)}
              </div>
            </section>;
          })}
          <div className={styles.battleActions}>
            {end && !playing && <button type="button" onClick={() => onFinish(end)}>View result</button>}
            <button type="button" onClick={onReset}>Reset battle</button>
            <button type="button" onClick={onEdit}>Edit teams</button>
          </div>
        </>} />
      <p className={styles.battleHelp}>You control both teams. Choose a move for the highlighted Pokémon. Every attack waits for your click.</p>
    </div>
  );
}
