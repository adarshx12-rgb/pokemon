'use client';
import { useReducer, useState } from 'react';
import type { EndEvent, Side } from '@/lib/battle/types';
import { loadMember } from '@/lib/showdown/loadMember';
import { EMPTY_TEAMS, randomFillCount, teamsReducer } from '@/lib/showdown/teams';
import { BattleScreen } from './BattleScreen';
import { MatchupPreview } from './MatchupPreview';
import { ResultScreen } from './ResultScreen';
import { TeamPanel } from './TeamPanel';

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
  const [result, setResult] = useState<EndEvent | null>(null);
  const [loading, setLoading] = useState<Record<Side, boolean>>({ A: false, B: false });
  const [toast, setToast] = useState<{ message: string; retry: () => void } | null>(null);

  const withLoading = async (side: Side, job: () => Promise<void>) => {
    setLoading(l => ({ ...l, [side]: true }));
    setToast(null);
    try {
      await job();
    } catch (err) {
      const notFound = err instanceof Error && err.message === 'not_found';
      setToast({ message: notFound ? 'That Pokémon isn’t in the Pokédex.' : 'Couldn’t reach the Pokédex.', retry: () => void withLoading(side, job) });
    } finally {
      setLoading(l => ({ ...l, [side]: false }));
    }
  };

  const add = (side: Side) => (slug: string) =>
    withLoading(side, async () => dispatch({ type: 'add', side, member: await loadMember(slug) }));

  const randomize = () =>
    withLoading('B', async () => {
      const members = await Promise.all(sample(names, randomFillCount(teams.B)).map(loadMember));
      dispatch({ type: 'fillRandom', side: 'B', members });
    });

  const startBattle = () => { setSeed(Date.now()); setResult(null); setPhase('battle'); };
  const canBattle = teams.A.length > 0 && teams.B.length > 0 && !loading.A && !loading.B;

  return (
    <main className="px-6 pb-32 pt-36 md:px-16">
      <header className="mb-16 max-w-3xl">
        <p className="eyebrow">Stats, speed and type matchups</p>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl md:text-9xl"><span className="text-gold-gradient italic">Showdown</span></h1>
        <p className="mt-6 max-w-xl text-muted">Build two teams of up to six. Every Pokémon fights at level 50 and always uses its strongest move against the current opponent.</p>
      </header>

      {phase === 'build' && (
        <div className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-2">
            <TeamPanel side="A" title="Your Team" team={teams.A} names={names} loading={loading.A} dispatch={dispatch} onAdd={add('A')} />
            <TeamPanel side="B" title="Opponent" team={teams.B} names={names} loading={loading.B} dispatch={dispatch} onAdd={add('B')} onRandomize={randomize} />
          </div>
          <MatchupPreview a={teams.A} b={teams.B} />
          <div className="flex justify-center">
            <button type="button" data-testid="battle-start" className="btn-gold !px-12 !py-4 text-base" disabled={!canBattle} onClick={startBattle}>
              Battle!
            </button>
          </div>
        </div>
      )}

      {phase === 'battle' && (
        <BattleScreen
          key={seed}
          teamA={teams.A}
          teamB={teams.B}
          seed={seed}
          onFinish={end => { setResult(end); setPhase('result'); }}
        />
      )}

      {phase === 'result' && result && (
        <ResultScreen
          result={result}
          teamA={teams.A}
          teamB={teams.B}
          onRematch={startBattle}
          onEdit={() => setPhase('build')}
        />
      )}

      {toast && (
        <div role="alert" className="border-gold-frame fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-surface px-6 py-3 text-sm">
          <span>{toast.message}</span>
          <button type="button" onClick={toast.retry} className="text-gold-light underline underline-offset-4">Retry</button>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="text-muted">✕</button>
        </div>
      )}
    </main>
  );
}
