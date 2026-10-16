'use client';
import { useReducer, useRef, useState } from 'react';
import type { EndEvent, Side } from '@/lib/battle/types';
import { statsAtLevel50 } from '@/lib/battle/stats';
import { displayName } from '@/lib/pokeapi/names';
import { loadMember } from '@/lib/showdown/loadMember';
import { EMPTY_TEAMS, MAX_TEAM, randomFillCount, teamsReducer } from '@/lib/showdown/teams';
import { Arena } from './Arena';
import { BattleScreen } from './BattleScreen';
import { HpPanel } from './HpPanel';
import { MatchupPreview } from './MatchupPreview';
import { PokemonSprite } from './PokemonSprite';
import { ResultScreen } from './ResultScreen';
import { TeamPanel } from './TeamPanel';
import styles from './showdown.module.css';

type Phase = 'build' | 'battle' | 'result';

function sample<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function Showdown({ names }: { names: string[] }) {
  const [teams, dispatch] = useReducer(teamsReducer, EMPTY_TEAMS);
  const [phase, setPhase] = useState<Phase>('build');
  const [seed, setSeed] = useState(0);
  const [classic, setClassic] = useState(false);
  const [result, setResult] = useState<EndEvent | null>(null);
  const [loading, setLoading] = useState<Record<Side, boolean>>({ A: false, B: false });
  const busy = useRef<Record<Side, boolean>>({ A: false, B: false });
  const [toast, setToast] = useState<{ message: string; retry: () => void } | null>(null);

  const withLoading = async (side: Side, job: () => Promise<void>) => {
    if (busy.current[side]) return;
    busy.current[side] = true;
    setLoading(l => ({ ...l, [side]: true }));
    setToast(null);
    try {
      await job();
    } catch (err) {
      const notFound = err instanceof Error && err.message === 'not_found';
      setToast({ message: notFound ? 'That Pokémon is not in the Pokédex.' : 'Could not load Pokémon data. Try again.', retry: () => void withLoading(side, job) });
    } finally {
      busy.current[side] = false;
      setLoading(l => ({ ...l, [side]: false }));
    }
  };

  const add = (side: Side, slug: string) => {
    if (teams[side].length >= MAX_TEAM) return;
    return withLoading(side, async () => dispatch({ type: 'add', side, member: await loadMember(slug) }));
  };
  const randomize = () => withLoading('B', async () => {
    const members = await Promise.all(sample(names, randomFillCount(teams.B)).map(loadMember));
    dispatch({ type: 'fillRandom', side: 'B', members });
  });
  const canBattle = teams.A.length > 0 && teams.B.length > 0 && !loading.A && !loading.B;
  const startBattle = () => {
    if (!canBattle) return;
    setSeed(Date.now()); setResult(null); setPhase('battle');
  };
  const reset = () => {
    if (loading.A || loading.B) return;
    dispatch({ type: 'clear', side: 'A' }); dispatch({ type: 'clear', side: 'B' }); setToast(null);
  };
  const focusTeam = (side: Side) => {
    const input = document.getElementById(`pokemon-search-${side}`) as HTMLInputElement | null;
    if (input && !input.disabled) input.focus();
    else document.querySelector<HTMLButtonElement>(`[data-testid="slot-${side}-0"]`)?.focus();
  };
  const previewPanel = (side: Side) => {
    const pokemon = teams[side][0]?.pokemon;
    if (!pokemon) return null;
    const hp = statsAtLevel50(pokemon.baseStats).hp;
    return <HpPanel name={displayName(pokemon.name)} hp={hp} maxHp={hp} showNumbers={side === 'A'} fainted={teams[side].map(() => false)} />;
  };
  const previewSprite = (side: Side) => {
    const pokemon = teams[side][0]?.pokemon;
    return pokemon ? <PokemonSprite key={pokemon.name} pokemon={pokemon} side={side} classic={classic} /> : null;
  };
  const prompt = loading.A || loading.B ? 'Getting your Pokémon ready…'
    : canBattle ? `${displayName(teams.A[0].pokemon.name)} is ready. Select Fight to choose your moves!`
    : !teams.A.length && !teams.B.length ? 'What will you choose? Add a Pokémon to each team to begin.'
    : !teams.A.length ? 'Choose your first Pokémon to meet your rival.'
    : 'Your Pokémon is ready. Add an opponent to begin.';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><h1>Showdown<span>.</span><span className="sr-only"> A Pokémon battle simulator and team builder</span></h1><p>Your Pokémon showdown. Pick your favorites. Play both sides.</p></div>
        <div className={styles.visualMode} role="group" aria-label="Pokémon appearance">
          <button type="button" aria-pressed={!classic} onClick={() => setClassic(false)}>HD artwork</button>
          <button type="button" aria-pressed={classic} onClick={() => setClassic(true)}>Classic sprites</button>
        </div>
      </header>

      {phase === 'build' && (
        <div className={styles.builder}>
          <div className={styles.arenaColumn}>
            <Arena preview player={previewSprite('A')} opponent={previewSprite('B')} playerPanel={previewPanel('A')} opponentPanel={previewPanel('B')}
              dialogue={<p aria-live="polite">{prompt}</p>}
              commands={<>
                <button type="button" data-testid="battle-start" className={styles.fight} disabled={!canBattle} onClick={startBattle}><span aria-hidden>▶</span> Fight</button>
                <button type="button" onClick={() => focusTeam('A')}>Your team</button>
                <button type="button" onClick={() => focusTeam('B')}>Opponent</button>
                <button type="button" disabled={loading.A || loading.B || (!teams.A.length && !teams.B.length)} onClick={reset}>Reset</button>
              </>} />
            <div className={styles.arenaHint}><span>1–6 Pokémon on each team</span><span>Drag Poké Balls to reorder · First ball leads</span></div>
            <MatchupPreview a={teams.A} b={teams.B} />
            <details className={styles.rules}>
              <summary>How the battle works</summary>
              <p>Everyone fights at level 50 with 31 IVs, no EVs, and a neutral nature. Speed decides who moves first; Attack, Defense, special stats, and type matchups decide damage. HP keeps you in the fight.</p>
              <p>You control both teams. Select Fight, then click a move for the highlighted Pokémon to play its attack. Speed decides the order each round; neither side attacks automatically. When a Pokémon faints, the next Poké Ball in its lineup enters. The last team standing wins.</p>
              <p>Moves come from each species’ recorded learnset across the games. Default movesets favor naturally learned attacks; the menus also include compatible TM, tutor, and inherited moves. Some Pokémon can legitimately learn attacks of other types. Only damaging moves supported by this battle are included; Pokémon with none use Struggle.</p>
              <p>This is a simplified stat battle: no items, abilities, weather, or status effects. Accuracy, critical hits, and damage rolls mean rematches can end differently.</p>
              <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">Stats & artwork from PokéAPI</a>
            </details>
          </div>
          <div className={styles.teamsColumn}>
            <TeamPanel side="A" title="My team" team={teams.A} names={names} loading={loading.A} dispatch={dispatch} onAdd={slug => void add('A', slug)} />
            <TeamPanel side="B" title="Opponent" team={teams.B} names={names} loading={loading.B} dispatch={dispatch} onAdd={slug => void add('B', slug)} onRandomize={randomize} />
          </div>
        </div>
      )}
      {phase === 'battle' && <BattleScreen key={seed} teamA={teams.A} teamB={teams.B} seed={seed} classic={classic} onReset={startBattle} onEdit={() => setPhase('build')} onFinish={end => { setResult(end); setPhase('result'); }} />}
      {phase === 'result' && result && <ResultScreen result={result} teamA={teams.A} teamB={teams.B} onRematch={startBattle} onEdit={() => setPhase('build')} />}
      {toast && (
        <div role="alert" className={styles.toast}>
          <span>{toast.message}</span><button type="button" onClick={toast.retry}>Retry</button>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </main>
  );
}
