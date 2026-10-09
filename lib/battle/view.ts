import { displayName } from '@/lib/pokeapi/names';
import { statsAtLevel50 } from './stats';
import type { BattleEvent, Side, TeamMember } from './types';

export interface BattleView {
  active: Record<Side, number | null>;
  hp: Record<Side, number[]>;
  maxHp: Record<Side, number[]>;
  fainted: Record<Side, boolean[]>;
  message: string;
  messageId: number;
  winner: Side | null;
}

export type TeamNames = Record<Side, string[]>;

export const moveLabel = (name: string) => name.replace(/-/g, ' ').toUpperCase();

export function teamNames(teamA: TeamMember[], teamB: TeamMember[]): TeamNames {
  const up = (t: TeamMember[]) => t.map(m => displayName(m.pokemon.name).toUpperCase());
  return { A: up(teamA), B: up(teamB) };
}

export function initView(teamA: TeamMember[], teamB: TeamMember[]): BattleView {
  const max = (t: TeamMember[]) => t.map(m => statsAtLevel50(m.pokemon.baseStats).hp);
  return {
    active: { A: null, B: null },
    hp: { A: max(teamA), B: max(teamB) },
    maxHp: { A: max(teamA), B: max(teamB) },
    fainted: { A: teamA.map(() => false), B: teamB.map(() => false) },
    message: '',
    messageId: 0,
    winner: null,
  };
}

const label = (names: TeamNames, side: Side, index: number) =>
  side === 'B' ? `Enemy ${names.B[index]}` : names.A[index];

const say = (view: BattleView, message: string): BattleView => ({ ...view, message, messageId: view.messageId + 1 });

const withSide = <T,>(rec: Record<Side, T[]>, side: Side, index: number, value: T): Record<Side, T[]> => ({
  ...rec,
  [side]: rec[side].map((v, i) => (i === index ? value : v)),
});

export function applyEvent(view: BattleView, event: BattleEvent, names: TeamNames): BattleView {
  switch (event.kind) {
    case 'switchIn': {
      const next = { ...view, active: { ...view.active, [event.side]: event.index }, hp: withSide(view.hp, event.side, event.index, event.hp) };
      const name = names[event.side][event.index];
      return say(next, event.side === 'A' ? `Go! ${name}!` : `Enemy sent out ${name}!`);
    }
    case 'useMove':
      return say(view, `${label(names, event.side, event.index)} used ${moveLabel(event.move.name)}!`);
    case 'miss':
      return say(view, `${label(names, event.side, event.index)}'s attack missed!`);
    case 'damage': {
      const next = { ...view, hp: withSide(view.hp, event.side, event.index, event.hpAfter) };
      const parts: string[] = [];
      if (event.crit) parts.push('A critical hit!');
      if (event.effectiveness === 0) parts.push(`It doesn't affect ${label(names, event.side, event.index)}…`);
      else if (event.effectiveness > 1) parts.push("It's super effective!");
      else if (event.effectiveness < 1) parts.push("It's not very effective…");
      return parts.length ? say(next, parts.join(' ')) : next;
    }
    case 'faint':
      return say({ ...view, fainted: withSide(view.fainted, event.side, event.index, true) },
        `${label(names, event.side, event.index)} fainted!`);
    case 'end':
      return say({ ...view, winner: event.winner }, event.winner === 'A' ? 'You won the battle!' : 'You lost the battle…');
  }
}
