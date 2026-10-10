'use client';
import { TypeBadge } from '@/components/TypeBadge';
import { moveLabel } from '@/lib/battle/view';
import type { Side, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import { MAX_TEAM, type TeamsAction } from '@/lib/showdown/teams';
import { PokemonSearch } from './PokemonSearch';
import { StatRadar } from './StatRadar';

interface Props {
  side: Side;
  title: string;
  team: TeamMember[];
  names: string[];
  loading: boolean;
  dispatch: (a: TeamsAction) => void;
  onAdd: (slug: string) => void;
  onRandomize?: () => void;
}

export function TeamPanel({ side, title, team, names, loading, dispatch, onAdd, onRandomize }: Props) {
  return (
    <section className="border-gold-frame rounded-3xl bg-surface/60 p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl sm:text-4xl">{title}</h2>
        {onRandomize && (
          <button type="button" data-testid="randomize" onClick={onRandomize} disabled={loading} className="btn-ghost !px-5 !py-2 text-xs">
            🎲 Randomize
          </button>
        )}
      </div>
      <PokemonSearch side={side} names={names} disabled={team.length >= MAX_TEAM || loading} onPick={onAdd} />
      {loading && <p className="mt-3 text-xs text-gold-light">Summoning from the Pokédex…</p>}
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: MAX_TEAM }, (_, i) => {
          const m = team[i];
          if (!m) {
            return <li key={i} className="grid h-36 place-items-center rounded-2xl border border-dashed border-line text-xs text-muted">Empty slot</li>;
          }
          return (
            <li key={`${m.pokemon.name}-${i}`} data-testid={`slot-${side}-${i}`} className="relative rounded-2xl border border-line bg-ink p-4">
              <button type="button" aria-label={`Remove ${displayName(m.pokemon.name)}`} onClick={() => dispatch({ type: 'remove', side, index: i })}
                className="absolute right-3 top-3 text-muted transition hover:text-gold-light">✕</button>
              <div className="flex items-center gap-3 pr-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.pokemon.sprites.artwork ?? m.pokemon.sprites.front ?? ''} alt="" className="size-14 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{displayName(m.pokemon.name)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">{m.pokemon.types.map(t => <TypeBadge key={t} type={t} />)}</div>
                </div>
                <StatRadar stats={m.pokemon.baseStats} size={52} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {m.moves.map((mv, slot) => (
                  <select
                    key={slot}
                    value={mv.name}
                    aria-label={`Move ${slot + 1} for ${displayName(m.pokemon.name)}`}
                    onChange={e => {
                      const move = m.pokemon.movePool.find(x => x.name === e.target.value);
                      if (move) dispatch({ type: 'setMove', side, index: i, slot, move });
                    }}
                    className="min-w-0 truncate rounded-lg border border-line bg-surface px-1.5 py-1 text-[10px] uppercase"
                  >
                    {[mv, ...m.pokemon.movePool.filter(x => x.name !== mv.name).sort((a, b) => b.power - a.power)].map(x => (
                      <option key={x.name} value={x.name}>{moveLabel(x.name)} ({x.power})</option>
                    ))}
                  </select>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
