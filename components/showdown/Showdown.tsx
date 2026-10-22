'use client';
import { useReducer, useRef, useState, useSyncExternalStore } from 'react';
import type { EndEvent, Side } from '@/lib/battle/types';
import { statsAtLevel50 } from '@/lib/battle/stats';
import { displayName } from '@/lib/pokeapi/names';
import { loadMember } from '@/lib/showdown/loadMember';
import { EMPTY_TEAMS, MAX_TEAM, randomFillCount, teamsReducer } from '@/lib/showdown/teams';
import { BattleScreen } from './BattleScreen';
import { DsConsole } from './ds/DsConsole';
import { HpBox } from './ds/HpBox';
import { TopScreen } from './ds/TopScreen';
import dsStyles from './ds/ds.module.css';
import fxStyles from './ds/fx.module.css';
import { MatchupPreview } from './MatchupPreview';
import { PokemonSprite } from './PokemonSprite';
import { ResultScreen } from './ResultScreen';
import { TeamPanel } from './TeamPanel';
import styles from './showdown.module.css';

const noSubscribe = () => () => {};
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
  // ?layout=side is a dev-only switch, read client-side ('ds' during server render).
  const layout = useSyncExternalStore<'ds' | 'side'>(noSubscribe, () => (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).get('layout') === 'side' ? 'side' : 'ds'), () => 'ds');
  const [classic, setClassic] = useState(true); // pixel sprites by default
  const [result, setResult] = useState<{ end: EndEvent; lead: number } | null>(null);
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
  const previewPanel = (side: Side) => {
    const pokemon = teams[side][0]?.pokemon;
    if (!pokemon) return null;
    const hp = statsAtLevel50(pokemon.baseStats).hp;
    return <HpBox key={pokemon.name} name={displayName(pokemon.name).toUpperCase()} hp={hp} maxHp={hp} showNumbers={side === 'A'} fainted={teams[side].map(() => false)} side={side} />;
  };
  const previewSprite = (side: Side) => {
    const pokemon = teams[side][0]?.pokemon;
    return pokemon ? <div className={fxStyles.sprite}><PokemonSprite key={pokemon.name} pokemon={pokemon} side={side} classic={classic} /></div> : null;
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
            <DsConsole layout="ds" testId="arena-preview"
              top={<TopScreen player={previewSprite('A')} opponent={previewSprite('B')} playerBox={previewPanel('A')} opponentBox={previewPanel('B')}
                message={<p aria-live="polite">{prompt}</p>} />}
              bottom={<div className={dsStyles.builderMenu}>
                <h3 className={dsStyles.turnLabel}>TEAM SELECTION</h3>
                <button type="button" data-testid="battle-start" className={dsStyles.fightBtn} disabled={!canBattle} onClick={startBattle}>FIGHT</button>
                <button type="button" className={`${dsStyles.smallBtn} ${dsStyles.runBtn}`} disabled={loading.A || loading.B || (!teams.A.length && !teams.B.length)} onClick={reset}>RESET</button>
              </div>} />
            <div className={styles.arenaHint}><span>1–6 Pokémon on each team</span><span>Drag Poké Balls to reorder · First ball leads</span></div>
            <MatchupPreview a={teams.A} b={teams.B} />
            <details className={styles.rules}>
              <summary>How the battle works</summary>
              <p>Everyone fights at level 50 with 31 IVs, no EVs, and a neutral nature. You make the opening move; after that, Speed (including stat changes) decides who moves first each round. Attack, Defense, special stats, and type matchups decide damage. HP keeps you in the fight.</p>
              <p>You control both teams. Use the touch screen: select Fight and pick a move for whoever’s turn it is, or choose Pokémon to switch. Neither side acts automatically. When a Pokémon faints, you choose which Pokémon replaces it. The last team standing wins.</p>
              <p>Each Pokémon starts with the moves it knows at level 50, and you can change them in the builder. Moves have PP; a Pokémon with no PP left uses Struggle, which hurts it with recoil. Moves that raise or lower stats work too, and critical hits happen as in the Gen 4 games.</p>
              <p>This is still a simplified battle: no status conditions, abilities, items, weather, or move priority. Accuracy, critical hits, and damage rolls mean rematches can end differently.</p>
              <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">Stats & artwork from PokéAPI</a>
            </details>
          </div>
          <div className={styles.teamsColumn}>
            <TeamPanel side="A" title="My team" team={teams.A} names={names} loading={loading.A} dispatch={dispatch} onAdd={slug => void add('A', slug)} />
            <TeamPanel side="B" title="Opponent" team={teams.B} names={names} loading={loading.B} dispatch={dispatch} onAdd={slug => void add('B', slug)} onRandomize={randomize} />
          </div>
        </div>
      )}
      {phase === 'battle' && <BattleScreen key={seed} teamA={teams.A} teamB={teams.B} seed={seed} classic={classic} layout={layout} onReset={startBattle} onEdit={() => setPhase('build')} onFinish={(end, lead) => { setResult({ end, lead }); setPhase('result'); }} />}
      {phase === 'result' && result && <ResultScreen result={result.end} lead={result.lead} classic={classic} teamA={teams.A} teamB={teams.B} onRematch={startBattle} onEdit={() => setPhase('build')} />}
      {toast && (
        <div role="alert" className={styles.toast}>
          <span>{toast.message}</span><button type="button" onClick={toast.retry}>Retry</button>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </main>
  );
}
