import type { EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import { OptionBox } from './ds/CommandMenu';
import { DsConsole } from './ds/DsConsole';
import { TopScreen } from './ds/TopScreen';
import fxStyles from './ds/fx.module.css';
import dsStyles from './ds/ds.module.css';
import { PokemonSprite } from './PokemonSprite';

interface Props { result: EndEvent; teamA: TeamMember[]; teamB: TeamMember[]; lead: number; classic: boolean; onRematch: () => void; onEdit: () => void }

export function ResultScreen({ result, teamA, teamB, lead, classic, onRematch, onEdit }: Props) {
  const won = result.winner === 'A';
  const winner = (won ? teamA : teamB)[lead] ?? (won ? teamA : teamB)[0];
  const column = (side: Side, team: TeamMember[], title: string) => {
    const dealt = result.damageDealt[side];
    const mvp = dealt.indexOf(Math.max(...dealt));
    const max = Math.max(1, ...dealt);
    return (
      <section className={dsStyles.resultSide} data-testid={`result-${side}`} aria-label={title}>
        <h3>{title}</h3>
        <p className={dsStyles.mvp}>MVP: <strong>{displayName(team[mvp].pokemon.name).toUpperCase()}</strong></p>
        <ul>
          {team.map((m, i) => (
            <li key={i}>
              <div><span>{displayName(m.pokemon.name).toUpperCase()}</span><span>{dealt[i]} dmg</span></div>
              <div className={dsStyles.dmgTrack}><i data-mvp={i === mvp} style={{ width: `${(dealt[i] / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className={dsStyles.resultWrap}>
      <DsConsole testId="result"
        top={<TopScreen
          player={won ? <div className={fxStyles.sprite}><PokemonSprite pokemon={winner.pokemon} side="A" classic={classic} /></div> : undefined}
          opponent={won ? undefined : <div className={fxStyles.sprite}><PokemonSprite pokemon={winner.pokemon} side="B" classic={classic} /></div>}
          message={<div className={dsStyles.command}>
            <div className={dsStyles.say}>
              <p data-testid="result-banner">{won ? 'RIVAL was defeated!' : 'You were defeated!'}</p>
              {result.reason === 'turnCap' && <p className={dsStyles.capNote}>Decided on remaining HP after the 500-turn limit.</p>}
            </div>
            <OptionBox>
              <button type="button" className={dsStyles.opt} onClick={onRematch}>REMATCH</button>
              <button type="button" className={dsStyles.opt} onClick={onEdit}>EDIT TEAMS</button>
            </OptionBox>
          </div>} />} />
      <div className={dsStyles.resultSides}>
        {column('A', teamA, 'Your team')}
        {column('B', teamB, 'Opponent')}
      </div>
    </div>
  );
}
