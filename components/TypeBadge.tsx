import { TYPE_COLORS } from '@/data/typeColors';
import type { TypeName } from '@/lib/battle/types';

export function TypeBadge({ type }: { type: TypeName }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}
