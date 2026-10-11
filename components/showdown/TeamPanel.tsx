'use client';
import { useState } from 'react';
import { TypeBadge } from '@/components/TypeBadge';
import { moveLabel } from '@/lib/battle/view';
import { statsAtLevel50 } from '@/lib/battle/stats';
import type { Side, StatBlock, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import { MAX_TEAM, type TeamsAction } from '@/lib/showdown/teams';
import { PokemonSearch } from './PokemonSearch';
import { TeamOrder } from './TeamOrder';
import styles from './showdown.module.css';

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

const STATS: [keyof StatBlock, string][] = [['hp', 'HP'], ['atk', 'Attack'], ['def', 'Defense'], ['spa', 'Sp. Atk'], ['spd', 'Sp. Def'], ['spe', 'Speed']];
const PICKS = { A: ['chikorita', 'cyndaquil', 'totodile'], B: ['pikachu', 'gengar', 'dragonite'] };

export function TeamPanel({ side, title, team, names, loading, dispatch, onAdd, onRandomize }: Props) {
  const [selection, setSelection] = useState(0);
  const selected = Math.min(selection, Math.max(0, team.length - 1));
  const member = team[selected];
  const stats = member ? statsAtLevel50(member.pokemon.baseStats) : null;
  const focusSearch = () => document.getElementById(`pokemon-search-${side}`)?.focus();
  return (
    <section className={styles.teamPanel} aria-labelledby={`team-title-${side}`}>
      <div className={styles.teamHeading}>
        <h2 id={`team-title-${side}`}>{title} <span>{team.length} / 6</span></h2>
        {onRandomize && <button type="button" data-testid="randomize" onClick={onRandomize} disabled={loading} className={styles.textButton}>Randomize</button>}
      </div>
      <TeamOrder side={side} team={team} selected={selected} disabled={loading} onSelect={setSelection} onAdd={focusSearch}
        onReorder={(from, to) => { dispatch({ type: 'reorder', side, from, to }); setSelection(to); }} />
      <PokemonSearch side={side} names={names} disabled={team.length >= MAX_TEAM || loading} loading={loading} onPick={onAdd} />
      {loading && <p role="status" className={styles.loading}>Loading Pokémon and moves…</p>}
      {!member && !loading && <div className={styles.quickPicks}><span>Try</span>{PICKS[side].map(name => <button key={name} type="button" onClick={() => onAdd(name)}>{displayName(name)}</button>)}</div>}
      {member && stats && (
        <div className={styles.memberDetails}>
          <div className={styles.memberIntro}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.pokemon.sprites.artwork ?? member.pokemon.sprites.front ?? undefined} alt={`${displayName(member.pokemon.name)} official artwork`} className={styles.artwork} />
            <div>
              <p className={styles.memberIndex}>#{String(member.pokemon.id).padStart(3, '0')} / {selected === 0 ? 'First into battle' : `Battle position ${selected + 1}`}</p>
              <h3>{displayName(member.pokemon.name)}</h3>
              <div className={styles.types}>{member.pokemon.types.map(t => <TypeBadge key={t} type={t} />)}</div>
            </div>
            <button type="button" className={styles.remove} disabled={loading} aria-label={`Remove ${displayName(member.pokemon.name)}`} onClick={() => dispatch({ type: 'remove', side, index: selected })}>×</button>
          </div>
          <dl className={styles.stats} aria-label="Stats at level 50">
            {STATS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{stats[key]}</dd><span aria-hidden style={{ width: `${Math.min(100, stats[key] / 3)}%` }} /></div>)}
          </dl>
          <details className={styles.moveDetails}>
            <summary>Moveset <span>{member.moves.length} moves · Edit</span></summary>
            <div className={styles.moves}>
              {member.moves.map((mv, slot) => (
                <label key={slot}><span>Move {slot + 1}</span><select value={mv.name} aria-label={`Move ${slot + 1} for ${displayName(member.pokemon.name)}`}
                  onChange={e => {
                    const move = member.pokemon.movePool.find(x => x.name === e.target.value);
                    if (move) dispatch({ type: 'setMove', side, index: selected, slot, move });
                  }}>
                  {[mv, ...member.pokemon.movePool.filter(x => x.name !== mv.name).sort((a, b) => b.power - a.power)].map(x => <option key={x.name} value={x.name}>{moveLabel(x.name)} ({x.power})</option>)}
                </select></label>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
