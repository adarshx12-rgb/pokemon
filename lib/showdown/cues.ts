import type { BattleView } from '@/lib/battle/view';
import type { BattleEvent, Side, TypeName } from '@/lib/battle/types';

/** Sound hook points. Nothing plays by default; a sound layer can subscribe with setCueHandler. */
export type Cue = 'ballThrow' | 'ballOpen' | 'cry' | 'moveUse' | 'hit' | 'superEffective' | 'notVeryEffective' | 'crit'
  | 'statUp' | 'statDown' | 'faint' | 'lowHp' | 'menuSelect' | 'menuBack' | 'victory' | 'defeat';
export interface CueDetail { pokemon?: string; type?: TypeName }
export type CueHandler = (cue: Cue, detail?: CueDetail) => void;

let handler: CueHandler | null = null;

export function setCueHandler(next: CueHandler | null): void {
  handler = next;
}

export function battleCue(cue: Cue, detail?: CueDetail): void {
  handler?.(cue, detail);
}

/** True when a hit takes a still-standing Pokémon from above 20% to 20% or below. */
export const crossesLowHp = (before: number, after: number, maxHp: number) =>
  maxHp > 0 && after > 0 && before / maxHp > 0.2 && after / maxHp <= 0.2;

export interface CueCall { cue: Cue; detail?: CueDetail }

/** The cues an event fires as it starts (send-out cues are timed by the animation instead). `view` is the state before the event. */
export function eventCues(event: BattleEvent, view: BattleView, species: Record<Side, string[]>): CueCall[] {
  if (event.kind === 'end') return [{ cue: event.winner === 'A' ? 'victory' : 'defeat' }];
  const pokemon = species[event.side][event.index];
  const low = (hpAfter: number): CueCall[] =>
    crossesLowHp(view.hp[event.side][event.index], hpAfter, view.maxHp[event.side][event.index]) ? [{ cue: 'lowHp', detail: { pokemon } }] : [];
  switch (event.kind) {
    case 'useMove': return [{ cue: 'moveUse', detail: { pokemon, type: event.move.type } }];
    case 'damage': {
      if (event.amount <= 0) return [];
      const calls: CueCall[] = [{ cue: 'hit', detail: { pokemon } }];
      if (event.crit) calls.push({ cue: 'crit' });
      if (event.effectiveness > 1) calls.push({ cue: 'superEffective' });
      else if (event.effectiveness < 1) calls.push({ cue: 'notVeryEffective' });
      return [...calls, ...low(event.hpAfter)];
    }
    case 'recoil': return [{ cue: 'hit', detail: { pokemon } }, ...low(event.hpAfter)];
    case 'stat': return event.applied ? [{ cue: event.applied > 0 ? 'statUp' : 'statDown', detail: { pokemon } }] : [];
    case 'faint': return [{ cue: 'faint', detail: { pokemon } }];
    default: return [];
  }
}
