'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_COLORS } from '@/data/typeColors';
import { useReducedMotion } from 'framer-motion';
import { createBattle, replaceFirstHealthy } from '@/lib/battle/engine';
import { displayName } from '@/lib/pokeapi/names';
import { fightOptions } from '@/lib/showdown/menu';
import { eventDelay } from '@/lib/battle/pacing';
import { statsAtLevel50 } from '@/lib/battle/stats';
import { isStatMove, type BattleEvent, type EndEvent, type MegaForm, type Side, type StatBlock, type TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, megaLabel, teamNames, type BattleView } from '@/lib/battle/view';
import { HpPanel } from './HpPanel';
import { MegaStone } from './MegaStone';
import { TextBox } from './TextBox';
import { Arena } from './Arena';
import { PokemonSprite } from './PokemonSprite';
import styles from './showdown.module.css';

type Fx = { key: number; kind: 'enter' | 'mega' | 'lunge' | 'hit' | 'faint'; side: Side; color?: string; strong?: boolean };

const STAT_LABELS: [keyof StatBlock, string][] = [['atk', 'Atk'], ['def', 'Def'], ['spa', 'SpA'], ['spd', 'SpD'], ['spe', 'Spe']];

/** "Mega Charizard X" / "Primal Kyogre" for headings (the battle text uses the uppercase form). */
const formTitle = (form: string, species: string) => megaLabel(form, displayName(species)).replace(/^MEGA /, 'Mega ').replace(/^PRIMAL /, 'Primal ');

function fxFor(events: BattleEvent[], i: number): Fx | null {
  const e = events[i];
  if (e.kind === 'switchIn') return { key: i, kind: 'enter', side: e.side };
  if (e.kind === 'mega') return { key: i, kind: 'mega', side: e.side };
  if (e.kind === 'useMove' && !isStatMove(e.move)) return { key: i, kind: 'lunge', side: e.side };
  if (e.kind === 'faint') return { key: i, kind: 'faint', side: e.side };
  if (e.kind === 'damage' && e.amount > 0) {
    const prev = events[i - 1];
    const color = prev?.kind === 'useMove' ? TYPE_COLORS[prev.move.type] : '#ffffff';
    return { key: i, kind: 'hit', side: e.side, color, strong: e.effectiveness > 1 || e.crit };
  }
  if (e.kind === 'recoil' && e.amount > 0) return { key: i, kind: 'hit', side: e.side, color: '#ffffff' };
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
  const [megaPick, setMegaPick] = useState<Record<Side, string | null>>({ A: null, B: null }); // a Mega form to take with the next move
  const playing = events.length > 0 && index <= events.length;
  const end = events.find((event): event is EndEvent => event.kind === 'end');

  useEffect(() => {
    if (!playing) return;
    const prev = index === 0 ? null : events[index - 1];
    // Damage waits for the HP bar to finish draining.
    const maxHp = prev && 'side' in prev && 'index' in prev ? view.maxHp[prev.side][prev.index] : undefined;
    const delay = prev ? eventDelay(prev, view.message, speed, maxHp, reduced) : 0;
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
  }, [playing, index, speed, events, names, view.message, view.maxHp, reduced]);

  useEffect(() => {
    if (!playing) busy.current = false;
  }, [playing]);

  // On phones the page header pushes the arena below the fold; start the battle with it in view.
  useEffect(() => {
    if (matchMedia('(max-width: 640px)').matches) document.querySelector('[data-testid="battle-stage"]')?.scrollIntoView({ block: 'start' });
  }, []);

  const attack = (side: Side, moveName: string) => {
    if (busy.current || playing || end) return;
    const next = battle.playMove(side, moveName, megaPick[side] ?? undefined);
    if (!next.length) return;
    setMegaPick(p => ({ ...p, [side]: null }));
    // A fainted Pokémon is replaced by the next healthy one in line.
    for (let side = battle.replacing; side; side = battle.replacing) next.push(...replaceFirstHealthy(battle, (side === 'A' ? teamA : teamB).length));
    busy.current = true;
    setEvents(next);
    setIndex(0);
  };

  const animMs = `${450 / speed}ms`;
  const megaMs = `${1400 / speed}ms`;
  const teamOf = (side: Side) => (side === 'A' ? teamA : teamB);
  const formOf = (side: Side, idx: number): MegaForm | undefined => {
    const name = view.forms[side][idx];
    return name ? teamOf(side)[idx].pokemon.megas?.find(f => f.name === name) : undefined;
  };

  const sprite = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    const base = teamOf(side)[idx].pokemon;
    const form = formOf(side, idx);
    const p = form ? { ...base, name: form.name, types: form.types, sprites: form.sprites } : base;
    // The key only changes when this sprite gets a new effect, so idle sprites never replay an animation.
    const f = sideFx[side];
    const anim = view.fainted[side][idx] ? 'faint-drop'
      : f?.kind === 'enter' ? (side === 'A' ? 'slide-in-left' : 'slide-in-right')
      : f?.kind === 'mega' ? 'mega-evolve'
      : f?.kind === 'lunge' ? (side === 'A' ? 'lunge-a' : 'lunge-b')
      : f?.kind === 'hit' ? (f.strong ? 'shake-strong' : 'shake')
      : null;
    return (
      <div key={`${side}-${idx}-${f?.key ?? 'none'}`} className="relative size-full"
        style={anim ? { animation: `${anim} ${anim === 'mega-evolve' ? megaMs : animMs} ease-out both` } : undefined}>
        <PokemonSprite pokemon={p} side={side} classic={classic} />
      </div>
    );
  };

  const panel = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    const form = view.forms[side][idx];
    return (
      <HpPanel key={`${side}-${idx}`} name={form ? megaLabel(form, names[side][idx]) : names[side][idx]} mega={!!form}
        hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers fainted={view.fainted[side]} />
    );
  };

  const nextSide = battle.nextSide;
  const nextName = nextSide ? names[nextSide][view.active[nextSide] ?? 0] : '';
  const prompt = !events.length ? `What will ${nextName} do? Choose a move.` : view.message;

  return (
    <div className={styles.battle}>
      <Arena player={sprite('A')} opponent={sprite('B')} playerPanel={panel('A')} opponentPanel={panel('B')}
        overlay={fx?.kind === 'hit' ? <div key={fx.key} aria-hidden className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: fx.color, animation: `hit-flash ${animMs} ease-out both` }} />
          : fx?.kind === 'mega' && <div key={fx.key} aria-hidden className={`pointer-events-none absolute inset-0 ${styles.megaFlash}`} style={{ animation: `hit-flash ${megaMs} ease-out both` }} />}
        dialogue={<div>
          <TextBox key={view.messageId} message={prompt} speed={speed} />
          {!playing && !end && <p className={styles.turnPrompt} data-testid="turn-prompt">Turn {battle.turn} · {nextSide === 'A' ? 'Your' : 'Opponent'} {nextName}: choose a move.</p>}
        </div>}
        commands={<>
          {(['A', 'B'] as const).map(side => {
            const idx = view.active[side] ?? 0;
            const member = teamOf(side)[idx];
            const options = fightOptions(member.moves, view.pp[side][idx] ?? []);
            const ready = !playing && !end && nextSide === side;
            const form = formOf(side, idx);
            const title = form ? formTitle(form.name, member.pokemon.name) : displayName(member.pokemon.name);
            // Every Pokémon with a Mega form may Mega Evolve once, while it can still fight.
            const megas = !form && !view.fainted[side][idx] ? member.pokemon.megas ?? [] : [];
            const picked = megas.find(f => f.name === megaPick[side]);
            const before = statsAtLevel50(member.pokemon.baseStats);
            return <section key={side} className={styles.moveMenu} aria-label={`${side === 'A' ? 'Your' : 'Opponent'} ${title} moves`} data-active={ready} data-next={nextSide === side}>
              <h2><span>{side === 'A' ? 'Your' : 'Opponent'} {title}{form && <MegaStone size={16} />}</span><small>{ready ? (picked ? 'Mega Evolves, then attacks: choose a move' : 'Choose a move') : playing ? 'Playing move…' : end ? 'Battle over' : 'Waiting'}</small></h2>
              {megas.length > 0 && <div className={styles.megaPicks}>
                {megas.map(f => {
                  const on = megaPick[side] === f.name;
                  const name = formTitle(f.name, member.pokemon.name);
                  // One form shows "Mega" (or "Primal"); several show their letter, e.g. "Mega X".
                  const short = megas.length > 1 ? name.replace(`${displayName(member.pokemon.name)} `, '') : name.split(' ')[0];
                  return <button key={f.name} type="button" className={styles.megaButton} data-testid={`mega-${side}-${f.name}`} aria-pressed={on} disabled={!ready}
                    aria-label={`Mega Evolve into ${name}`} title={`Mega Evolve into ${name}`}
                    onClick={() => setMegaPick(p => ({ ...p, [side]: on ? null : f.name }))}>
                    <MegaStone /><span>{short}</span>
                  </button>;
                })}
              </div>}
              {picked && (() => {
                const after = statsAtLevel50(picked.baseStats);
                return <p className={styles.megaStats} data-testid={`mega-stats-${side}`}>
                  <span>{picked.types.map(displayName).join(' / ')}</span>
                  {STAT_LABELS.map(([key, label]) => <span key={key} data-up={after[key] > before[key] || undefined} data-down={after[key] < before[key] || undefined}>
                    {label} {before[key]}→{after[key]}
                  </span>)}
                </p>;
              })()}
              <div className={styles.moveButtons}>
                {options.map(({ move, pp, disabled }) => <button key={move.name} type="button" data-testid={`move-${side}-${move.name}`} disabled={!ready || disabled}
                  onClick={() => attack(side, move.name)}
                  onPointerUp={event => {
                    // Touch browsers can consume the compatibility click after scrolling.
                    // A pan cancels the pointer; a completed tap plays the move immediately.
                    if (event.pointerType === 'touch' && ready && !disabled) attack(side, move.name);
                  }} style={{ borderLeftColor: TYPE_COLORS[move.type] }}>
                  <strong>{displayName(move.name)}</strong>
                  <span>{displayName(move.type)} · {move.damageClass}</span>
                  <small>{isStatMove(move) ? 'Stat move' : `Power ${move.power}`} · Accuracy {move.accuracy === null ? '—' : `${move.accuracy}%`} · PP {pp}/{move.pp ?? 5}</small>
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
