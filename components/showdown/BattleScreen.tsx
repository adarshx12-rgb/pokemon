'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_COLORS } from '@/data/typeColors';
import { simulate } from '@/lib/battle/engine';
import type { BattleEvent, EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, teamNames, type BattleView } from '@/lib/battle/view';
import { HpPanel } from './HpPanel';
import { TextBox } from './TextBox';

const DURATION: Record<BattleEvent['kind'], number> = { switchIn: 1200, useMove: 900, miss: 900, damage: 1100, faint: 1000, end: 1600 };
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

interface Props { teamA: TeamMember[]; teamB: TeamMember[]; seed: number; onFinish: (end: EndEvent) => void }

export function BattleScreen({ teamA, teamB, seed, onFinish }: Props) {
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
    const delay = index === 0 ? 300 : DURATION[events[index - 1].kind] / speed;
    const t = setTimeout(() => {
      setView(v => applyEvent(v, events[index], names));
      const next = fxFor(events, index);
      setFx(next);
      if (next) setSideFx(s => ({ ...s, [next.side]: next }));
      setIndex(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [playing, index, speed, events, names]);

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

  const alive = (side: Side) => view.fainted[side].filter(f => !f).length;
  const animMs = `${450 / speed}ms`;

  const sprite = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    const team = side === 'A' ? teamA : teamB;
    const p = team[idx].pokemon;
    const src = side === 'A' ? p.sprites.back ?? p.sprites.artwork : p.sprites.front ?? p.sprites.artwork;
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src ?? ''} alt={names[side][idx]} className="size-full object-contain [image-rendering:pixelated] drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" />
      </div>
    );
  };

  const panel = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    return (
      <HpPanel name={names[side][idx]} hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers={side === 'A'}
        alive={alive(side)} total={view.fainted[side].length} />
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div data-testid="battle-stage" className="border-gold-frame relative aspect-[4/3] overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,#1d1a12,#0a0a0a_70%)]">
        {/* ground ellipses */}
        <div className="absolute right-[6%] top-[34%] h-[8%] w-[38%] rounded-[50%] bg-gold/15 blur-sm" />
        <div className="absolute bottom-[28%] left-[4%] h-[8%] w-[42%] rounded-[50%] bg-gold/15 blur-sm" />

        <div className="absolute left-[4%] top-[6%] w-[46%]">{panel('B')}</div>
        <div className="absolute right-[8%] top-[4%] size-[34%]">{sprite('B')}</div>
        <div className="absolute bottom-[26%] left-[6%] size-[38%]">{sprite('A')}</div>
        <div className="absolute bottom-[29%] right-[4%] w-[46%]">{panel('A')}</div>

        {fx?.kind === 'hit' && (
          <div key={fx.key} aria-hidden className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: fx.color, animation: `hit-flash ${animMs} ease-out both` }} />
        )}

        <div className="absolute inset-x-[2%] bottom-[2%] h-[24%]">
          <TextBox key={view.messageId} message={view.message} speed={speed} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-ghost !px-5 !py-2 text-xs" onClick={() => setPlaying(p => !p)} disabled={index >= events.length}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <div role="group" aria-label="Battle speed" className="flex overflow-hidden rounded-full border border-gold/50">
          {SPEEDS.map(s => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}
              className={`px-4 py-2 text-xs transition ${speed === s ? 'bg-gold text-ink' : 'text-gold-light hover:bg-gold/10'}`}>
              {s}×
            </button>
          ))}
        </div>
        <button type="button" data-testid="skip" className="btn-gold !px-5 !py-2 text-xs" onClick={skip}>Skip to result</button>
      </div>
    </div>
  );
}
