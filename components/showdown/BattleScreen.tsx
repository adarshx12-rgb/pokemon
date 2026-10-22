'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { createBattle } from '@/lib/battle/engine';
import { menuFor, type MenuState } from '@/lib/showdown/menu';
import { eventDelay } from '@/lib/battle/pacing';
import type { BattleEvent, EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, teamNames, type BattleView } from '@/lib/battle/view';
import { battleCue, eventCues } from '@/lib/showdown/cues';
import { fxAt, INTRO_MS, POP_MS, stepMs, THROW_MS, type FxPlay } from '@/lib/showdown/fx';
import { BallThrow, BattleFx, IntroFlash, OpenFlash } from './ds/BattleFx';
import { BottomScreen } from './ds/BottomScreen';
import { HpBox } from './ds/HpBox';
import dsStyles from './ds/ds.module.css';
import fxStyles from './ds/fx.module.css';
import { DsConsole } from './ds/DsConsole';
import { TopScreen } from './ds/TopScreen';
import { TextBox } from './TextBox';
import { PokemonSprite, spriteClass, spriteSrc } from './PokemonSprite';
import styles from './showdown.module.css';

// The event on screen: `out` is false while a send-out's ball is still in the air.
interface Step { id: number; event: BattleEvent; fx: FxPlay | null; out: boolean }

const sideOrder = (e: BattleEvent) => ('side' in e && e.side === 'A' ? 1 : 0);

interface Props { teamA: TeamMember[]; teamB: TeamMember[]; seed: number; classic: boolean; onFinish: (end: EndEvent) => void; onEdit: () => void; onReset: () => void }

export function BattleScreen({ teamA, teamB, seed, classic, onFinish, onEdit, onReset }: Props) {
  const [battle] = useState(() => createBattle(teamA, teamB, seed));
  // The opening plays the engine's two initial send-outs like any other events: the rival's first, as in the games.
  const [events, setEvents] = useState<BattleEvent[]>(() => [...battle.initialEvents].sort((a, b) => sideOrder(a) - sideOrder(b)));
  const names = useMemo(() => teamNames(teamA, teamB), [teamA, teamB]);
  const species = useMemo(() => ({ A: teamA.map(m => m.pokemon.name), B: teamB.map(m => m.pokemon.name) }), [teamA, teamB]);
  const [view, setView] = useState<BattleView>(() => initView(teamA, teamB));
  const viewRef = useRef(view);
  const [index, setIndex] = useState(0);
  const speed = 2;
  const reduced = !!useReducedMotion();
  const busy = useRef(false);
  const sequence = useRef(0);
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; fn: () => void }[]>([]); // timed parts of the current step
  const [step, setStep] = useState<Step | null>(null);
  const [skipped, setSkipped] = useState(-1); // the playback index whose step the player skipped
  const [typedId, setTypedId] = useState(-1); // the message a skip finished typing
  const [played, setPlayed] = useState(false); // false until the first command (the opening is still on)
  const [turn, setTurn] = useState<{ side: Side }>(() => ({ side: battle.nextSide ?? 'A' }));
  const [menu, setMenu] = useState<MenuState>(() => menuFor({ replacing: !!battle.replacing, layout: 'ds' }));
  const playing = events.length > 0 && index <= events.length;
  const end = events.find((event): event is EndEvent => event.kind === 'end');
  const skipNow = playing && skipped === index;

  useEffect(() => () => pending.current.forEach(p => clearTimeout(p.timer)), []);

  useEffect(() => {
    if (!playing) return;
    const prev = index === 0 ? null : events[index - 1];
    const maxHp = prev && 'side' in prev && 'index' in prev ? view.maxHp[prev.side][prev.index] : undefined;
    // Each step lasts its normal reading time, or longer when its animation needs it; skipping never shortens it.
    const delay = prev
      ? Math.max(eventDelay(prev, view.message, speed, maxHp, reduced), stepMs(prev, reduced ? null : fxAt(events, index - 1), reduced))
      : !played && !reduced ? INTRO_MS : 0;
    const later = (ms: number, fn: () => void) => {
      const entry = { fn, timer: setTimeout(() => { pending.current = pending.current.filter(p => p !== entry); fn(); }, ms) };
      pending.current.push(entry);
    };
    const t = setTimeout(() => {
      if (index === events.length) {
        // Playback is over: the menu serves whoever acts next (or must replace a fainted Pokémon).
        setTurn(t => ({ side: battle.replacing ?? battle.nextSide ?? t.side }));
        setMenu(menuFor({ replacing: !!battle.replacing, layout: 'ds' }));
        setIndex(i => i + 1);
        return;
      }
      const event = events[index];
      const before = viewRef.current;
      const next = applyEvent(before, event, names);
      viewRef.current = next;
      setView(next);
      pending.current.forEach(p => clearTimeout(p.timer));
      pending.current = [];
      const id = sequence.current++;
      const throwing = event.kind === 'switchIn' && !reduced;
      setStep({ id, event, fx: reduced ? null : fxAt(events, index), out: !throwing });
      for (const { cue, detail } of eventCues(event, before, species)) battleCue(cue, detail);
      if (event.kind === 'switchIn') {
        const pokemon = species[event.side][event.index];
        if (throwing) {
          battleCue('ballThrow', { pokemon });
          later(THROW_MS, () => { setStep(s => (s?.id === id ? { ...s, out: true } : s)); battleCue('ballOpen', { pokemon }); });
          later(THROW_MS + POP_MS, () => battleCue('cry', { pokemon }));
        } else battleCue('cry', { pokemon });
      }
      setIndex(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [playing, index, speed, reduced, events, names, species, battle, played, view.message, view.maxHp]);

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
    setPlayed(true);
    setSkipped(-1);
    setEvents(next);
    setIndex(0);
  };

  // Tapping the text box finishes the current step: typing, HP drain, animation and its remaining cues.
  // The next event still waits for its normal timing, so nothing is ever skipped.
  const skip = () => {
    if (!playing) return;
    setSkipped(index);
    setTypedId(view.messageId);
    const rest = pending.current;
    pending.current = [];
    rest.forEach(p => { clearTimeout(p.timer); p.fn(); });
  };

  const live = step && !skipNow && !reduced ? step : null; // the step whose animations are still running
  const on = (side: Side, kind: BattleEvent['kind']) => !!step && step.event.kind === kind && 'side' in step.event && step.event.side === side;

  const sprite = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    if (on(side, 'switchIn') && !step!.out) return null; // still in the ball
    const team = side === 'A' ? teamA : teamB;
    const p = team[idx].pokemon;
    const e = live?.event;
    const mine = !!e && 'side' in e && e.side === side;
    const anim = !mine ? null
      : e.kind === 'switchIn' ? fxStyles.pop
      : e.kind === 'useMove' && live.fx?.style === 'contact' ? (side === 'A' ? fxStyles.lungeA : fxStyles.lungeB)
      : (e.kind === 'damage' && e.amount > 0) || e.kind === 'recoil' ? fxStyles.blink
      : e.kind === 'faint' ? fxStyles.sink
      : e.kind === 'withdraw' ? fxStyles.withdraw
      : null;
    const fainted = view.fainted[side][idx];
    const gone = !anim && (fainted || on(side, 'withdraw'));
    const src = spriteSrc(p, side, classic);
    const silhouette = anim === fxStyles.pop ? fxStyles.silhouette : anim === fxStyles.withdraw ? fxStyles.redSilhouette : null;
    return (
      <div className={fainted ? fxStyles.clip : fxStyles.sprite}>
        <div className={`${fxStyles.sprite} ${anim ?? ''} ${gone ? fxStyles.gone : ''}`}>
          <PokemonSprite pokemon={p} side={side} classic={classic} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {silhouette && src && <img src={src} alt="" aria-hidden draggable={false} className={`${spriteClass(side, classic)} ${silhouette}`} />}
        </div>
      </div>
    );
  };

  const panel = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    const box = reduced ? '' : on(side, 'switchIn') ? (!step!.out ? fxStyles.boxHidden : live ? fxStyles.boxIn : '')
      : view.fainted[side][idx] ? (live && on(side, 'faint') ? fxStyles.boxOut : fxStyles.boxHidden) : '';
    return (
      <div className={`${fxStyles.box} ${box}`} data-side={side} style={box === fxStyles.boxIn ? { animationDelay: `${POP_MS}ms` } : undefined}>
        <HpBox key={`${side}-${idx}`} name={names[side][idx]} hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers
          fainted={view.fainted[side]} side={side} skip={skipNow} />
      </div>
    );
  };

  const overlay = live && (
    live.event.kind === 'switchIn' ? (live.out ? <OpenFlash key={live.id} side={live.event.side} /> : <BallThrow key={live.id} side={live.event.side} />)
      : live.fx && <BattleFx key={live.id} style={live.fx.style} type={live.fx.type} from={live.fx.from} />
  );
  const opening = !played && index === 0 && !reduced && !skipNow;

  const turnSide = turn.side;
  const turnName = names[turnSide][view.active[turnSide] ?? 0];
  const asking = !played && !playing;
  const prompt = asking ? `What will ${turnName} do? Choose a move.` : view.message;
  const member = (turnSide === 'A' ? teamA : teamB)[view.active[turnSide] ?? 0];
  const sideTeam = turnSide === 'A' ? teamA : teamB;

  return (
    <div className={styles.battle}>
      <DsConsole layout="ds" testId="battle-stage"
        top={<TopScreen player={sprite('A')} opponent={sprite('B')} playerBox={panel('A')} opponentBox={panel('B')} intro={opening}
          message={<TextBox key={asking ? 'prompt' : view.messageId} message={prompt} speed={speed} complete={!asking && typedId === view.messageId} />}
          overlay={<>{opening && <IntroFlash />}{overlay}</>} onAdvance={skip} />}
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
