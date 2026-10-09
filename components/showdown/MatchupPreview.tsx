import type { TeamMember } from '@/lib/battle/types';
import { coverage } from '@/lib/showdown/matchup';

export function MatchupPreview({ a, b }: { a: TeamMember[]; b: TeamMember[] }) {
  if (!a.length || !b.length) return null;
  const rows = [
    { label: 'Your team hits super-effectively', value: coverage(a, b), of: b.length },
    { label: 'Opponent hits super-effectively', value: coverage(b, a), of: a.length },
  ];
  return (
    <div className="grid gap-4 rounded-3xl border border-line p-6 sm:grid-cols-2">
      {rows.map(r => (
        <div key={r.label}>
          <p className="text-sm text-muted">{r.label}</p>
          <p className="mt-2 font-serif text-4xl">
            <span className="text-gold-gradient">{r.value}</span>
            <span className="text-muted"> / {r.of}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
