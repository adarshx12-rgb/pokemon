import type { EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';

interface Props { result: EndEvent; teamA: TeamMember[]; teamB: TeamMember[]; onRematch: () => void; onEdit: () => void }

export function ResultScreen({ result, teamA, teamB, onRematch, onEdit }: Props) {
  const won = result.winner === 'A';
  const column = (side: Side, team: TeamMember[], title: string) => {
    const dealt = result.damageDealt[side];
    const mvp = dealt.indexOf(Math.max(...dealt));
    const max = Math.max(1, ...dealt);
    return (
      <div className="border-gold-frame rounded-3xl bg-surface/60 p-6">
        <p className="text-sm text-muted">{title}</p>
        <p className="mt-2 font-display text-3xl">MVP: <span className="text-gold-gradient italic">{displayName(team[mvp].pokemon.name)}</span></p>
        <ul className="mt-6 space-y-3">
          {team.map((m, i) => (
            <li key={i} className="text-sm">
              <div className="flex justify-between"><span>{displayName(m.pokemon.name)}</span><span className="text-muted">{dealt[i]} dmg</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-line">
                <div className={`h-full rounded-full ${i === mvp ? 'bg-gold-light' : 'bg-gold-dark'}`} style={{ width: `${(dealt[i] / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl text-center">
      <h2 data-testid="result-banner" className={`font-display text-7xl italic sm:text-8xl md:text-[10rem] ${won ? 'text-gold-gradient' : 'text-muted'}`}>
        {won ? 'VICTORY' : 'DEFEAT'}
      </h2>
      {result.reason === 'turnCap' && <p className="text-sm text-muted">Decided on remaining HP after the 500-turn limit.</p>}
      <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
        {column('A', teamA, 'Your team')}
        {column('B', teamB, 'Opponent')}
      </div>
      <div className="mt-12 flex justify-center gap-4">
        <button type="button" className="btn-gold" onClick={onRematch}>Rematch</button>
        <button type="button" className="btn-ghost" onClick={onEdit}>Edit teams</button>
      </div>
    </div>
  );
}
