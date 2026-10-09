interface Props { name: string; hp: number; maxHp: number; showNumbers: boolean; alive: number; total: number }

export function HpPanel({ name, hp, maxHp, showNumbers, alive, total }: Props) {
  const pct = maxHp ? hp / maxHp : 0;
  const color = pct > 0.5 ? 'bg-emerald-400' : pct > 0.2 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="border-gold-frame rounded-xl bg-surface/90 p-3 font-pixel text-[9px] backdrop-blur sm:p-4 sm:text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate">{name}</span>
        <span className="shrink-0 text-gold-light">:L50</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded bg-gold px-1 text-[8px] text-ink sm:text-[10px]">HP</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/70 ring-1 ring-line">
          <div
            role="progressbar"
            aria-label={`${name} HP`}
            aria-valuenow={hp}
            aria-valuemin={0}
            aria-valuemax={maxHp}
            className={`h-full ${color} transition-[width,background-color] duration-700 ease-out`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
      {showNumbers && <p className="mt-2 text-right">{hp}/{maxHp}</p>}
      <div className="mt-2 flex gap-1" aria-label={`${alive} of ${total} Pokémon remaining`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`size-2 rounded-full ${i < alive ? 'bg-gold-light' : 'bg-line'}`} />
        ))}
      </div>
    </div>
  );
}
