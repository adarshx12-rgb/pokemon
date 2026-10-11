import type { TeamMember } from '@/lib/battle/types';
import { coverage } from '@/lib/showdown/matchup';
import styles from './showdown.module.css';

export function MatchupPreview({ a, b }: { a: TeamMember[]; b: TeamMember[] }) {
  if (!a.length || !b.length) return null;
  const rows = [
    { label: 'Your team hits super-effectively', value: coverage(a, b), of: b.length },
    { label: 'Opponent hits super-effectively', value: coverage(b, a), of: a.length },
  ];
  return (
    <div className={styles.matchup}>
      {rows.map(r => (
        <div key={r.label}>
          <p>{r.label}</p>
          <strong>{r.value} <small>/ {r.of} Pokémon</small></strong>
        </div>
      ))}
    </div>
  );
}
