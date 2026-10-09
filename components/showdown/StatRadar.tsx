import type { StatBlock } from '@/lib/battle/types';

const KEYS: (keyof StatBlock)[] = ['hp', 'atk', 'def', 'spe', 'spd', 'spa'];
const MAX = 200;

export function StatRadar({ stats, size = 64 }: { stats: StatBlock; size?: number }) {
  const c = size / 2, r = size / 2 - 4;
  const point = (i: number, f: number) => {
    const a = (Math.PI * 2 * i) / KEYS.length - Math.PI / 2;
    return `${c + Math.cos(a) * r * f},${c + Math.sin(a) * r * f}`;
  };
  const outline = KEYS.map((_, i) => point(i, 1)).join(' ');
  const shape = KEYS.map((k, i) => point(i, Math.min(stats[k] / MAX, 1))).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Base stats: ${KEYS.map(k => `${k} ${stats[k]}`).join(', ')}`}>
      <polygon points={outline} fill="none" stroke="var(--color-line)" />
      <polygon points={shape} fill="rgba(212,175,55,0.35)" stroke="var(--color-gold)" strokeWidth={1} />
    </svg>
  );
}
