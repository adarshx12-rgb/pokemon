import { STRUGGLE } from '@/lib/battle/moves';
import type { Move } from '@/lib/battle/types';

/** The move buttons for a Pokémon; with no PP left anywhere (or no moves) Struggle is the only choice. */
export function fightOptions(moves: Move[], ppLeft: number[]): { move: Move; pp: number; disabled: boolean }[] {
  if (moves.length === 0 || ppLeft.every(p => p <= 0)) return [{ move: STRUGGLE, pp: STRUGGLE.pp, disabled: false }];
  return moves.map((move, i) => ({ move, pp: ppLeft[i] ?? 0, disabled: (ppLeft[i] ?? 0) <= 0 }));
}
