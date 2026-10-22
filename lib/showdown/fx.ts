import { TYPE_COLORS } from '@/data/typeColors';
import type { BattleEvent, Move, Side, TypeName } from '@/lib/battle/types';

export type FxStyle = 'contact' | 'projectile' | 'stat-up' | 'stat-down';
export type FxShape = 'flame' | 'splash' | 'bolt' | 'leaf' | 'shard' | 'wisp' | 'orb' | 'rock' | 'wind' | 'star';

/** Physical moves lunge, special moves fire a projectile, status moves glow by the direction of the change. */
export function fxFor(move: Move, applied?: number): FxStyle {
  if (move.damageClass === 'physical') return 'contact';
  if (move.damageClass === 'special') return 'projectile';
  const change = applied || (move.statChanges?.[0]?.change ?? 0);
  return change < 0 ? 'stat-down' : 'stat-up';
}

const SHAPES: Record<TypeName, FxShape> = {
  normal: 'star', fire: 'flame', water: 'splash', electric: 'bolt', grass: 'leaf', ice: 'shard',
  fighting: 'star', poison: 'orb', ground: 'rock', flying: 'wind', psychic: 'orb', bug: 'leaf',
  rock: 'rock', ghost: 'wisp', dragon: 'flame', dark: 'wisp', steel: 'shard', fairy: 'star',
};

/** One look per type: its colour and particle shape (shared by projectiles and impacts). */
export const TYPE_FX = Object.fromEntries(
  (Object.keys(SHAPES) as TypeName[]).map(t => [t, { color: TYPE_COLORS[t], shape: SHAPES[t] }]),
) as Record<TypeName, { color: string; shape: FxShape }>;

// Real-time animation lengths (ms) at normal motion; the playback speed does not shorten them.
export const INTRO_MS = 800; // screen flash, then the scene slides in
export const THROW_MS = 600; // ball arc
export const POP_MS = 400; // white silhouette grows into the Pokémon
export const SEND_OUT_MS = 1400; // throw + pop + HP box slide-in
const FX_MS: Record<FxStyle, number> = { contact: 600, projectile: 800, 'stat-up': 800, 'stat-down': 800 };
export const FAINT_MS = 700;
export const WITHDRAW_MS = 600;

export interface FxPlay { style: FxStyle; type: TypeName; from: Side }

/**
 * The effect shown with event `i`: a damaging move animates on its useMove when it lands (not on a miss or
 * "doesn't affect"); a stat move glows on each stat event that changed something. For stat styles `from` is the affected side.
 */
export function fxAt(events: BattleEvent[], i: number): FxPlay | null {
  const e = events[i];
  if (e.kind === 'useMove') {
    const next = events[i + 1];
    if (e.move.damageClass === 'status' || next?.kind !== 'damage' || next.amount <= 0) return null;
    return { style: fxFor(e.move), type: e.move.type, from: e.side };
  }
  if (e.kind === 'stat' && e.applied) {
    for (let j = i - 1; j >= 0; j--) {
      const prev = events[j];
      if (prev.kind === 'useMove') return { style: fxFor(prev.move, e.applied), type: prev.move.type, from: e.side };
    }
  }
  return null;
}

/** The shortest time an event's step stays on screen so its animation can finish (0 with reduced motion). */
export function stepMs(event: BattleEvent, fx: FxPlay | null, reduced: boolean): number {
  if (reduced) return 0;
  if (fx) return FX_MS[fx.style];
  return event.kind === 'switchIn' ? SEND_OUT_MS : event.kind === 'faint' ? FAINT_MS : event.kind === 'withdraw' ? WITHDRAW_MS : 0;
}
