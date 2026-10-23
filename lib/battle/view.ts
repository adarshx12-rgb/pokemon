import { displayName } from '@/lib/pokeapi/names';
import { statsAtLevel50 } from './stats';
import { ZERO_STAGES, type Stages } from './stages';
import type { BattleEvent, Side, StageStat, TeamMember } from './types';

export interface BattleView {
  active: Record<Side, number | null>;
  hp: Record<Side, number[]>;
  maxHp: Record<Side, number[]>;
  fainted: Record<Side, boolean[]>;
  pp: Record<Side, number[][]>;
  stages: Record<Side, Stages[]>;
  moveNames: Record<Side, string[][]>;
  message: string;
  messageId: number;
  winner: Side | null;
}

export type TeamNames = Record<Side, string[]>;

export const moveLabel = (name: string) => name.replace(/-/g, ' ').toUpperCase();

const STAT_NAMES: Record<StageStat, string> = {
  atk: 'ATTACK', def: 'DEFENSE', spa: 'SP. ATK', spd: 'SP. DEF', spe: 'SPEED', accuracy: 'ACCURACY', evasion: 'EVASIVENESS',
};

export const whatWillDo = (name: string) => `What will ${name} do?`;

export function hpColor(hp: number, maxHp: number): 'green' | 'yellow' | 'red' {
  const frac = maxHp > 0 ? hp / maxHp : 0;
  return frac > 0.5 ? 'green' : frac > 0.2 ? 'yellow' : 'red';
}

export function teamNames(teamA: TeamMember[], teamB: TeamMember[]): TeamNames {
  const up = (t: TeamMember[]) => t.map(m => displayName(m.pokemon.name).toUpperCase());
  return { A: up(teamA), B: up(teamB) };
}

const moveNamesOf = (m: TeamMember) => m.moves.map(mv => mv.name);
const movePp = (m: TeamMember) => m.moves.map(mv => mv.pp ?? 5);

export function initView(teamA: TeamMember[], teamB: TeamMember[]): BattleView {
  const max = (t: TeamMember[]) => t.map(m => statsAtLevel50(m.pokemon.baseStats).hp);
  return {
    active: { A: null, B: null },
    hp: { A: max(teamA), B: max(teamB) },
    maxHp: { A: max(teamA), B: max(teamB) },
    fainted: { A: teamA.map(() => false), B: teamB.map(() => false) },
    pp: { A: teamA.map(movePp), B: teamB.map(movePp) },
    moveNames: { A: teamA.map(moveNamesOf), B: teamB.map(moveNamesOf) },
    stages: { A: teamA.map(() => ZERO_STAGES), B: teamB.map(() => ZERO_STAGES) },
    message: '',
    messageId: 0,
    winner: null,
  };
}

const label = (names: TeamNames, side: Side, index: number, mid = false) =>
  side === 'B' ? `${mid ? 'the' : 'The'} foe's ${names.B[index]}` : names.A[index];

const say = (view: BattleView, message: string): BattleView => ({ ...view, message, messageId: view.messageId + 1 });

const withSide = <T,>(rec: Record<Side, T[]>, side: Side, index: number, value: T): Record<Side, T[]> => ({
  ...rec,
  [side]: rec[side].map((v, i) => (i === index ? value : v)),
});

export function applyEvent(view: BattleView, event: BattleEvent, names: TeamNames): BattleView {
  switch (event.kind) {
    case 'switchIn': {
      const next = { ...view, active: { ...view.active, [event.side]: event.index }, hp: withSide(view.hp, event.side, event.index, event.hp),
        stages: withSide(view.stages, event.side, event.index, ZERO_STAGES) };
      const name = names[event.side][event.index];
      return say(next, event.side === 'A' ? `Go! ${name}!` : `RIVAL sent out ${name}!`);
    }
    case 'useMove': {
      const slot = view.moveNames[event.side][event.index]?.indexOf(event.move.name) ?? -1;
      const next = slot < 0 ? view : { ...view, pp: withSide(view.pp, event.side, event.index, view.pp[event.side][event.index].map((v, i) => (i === slot ? event.ppLeft : v))) };
      return say(next, `${label(names, event.side, event.index)} used ${moveLabel(event.move.name)}!`);
    }
    case 'miss':
      return say(view, `${label(names, event.side, event.index)}'s attack missed!`);
    case 'damage': {
      const next = { ...view, hp: withSide(view.hp, event.side, event.index, event.hpAfter) };
      const parts: string[] = [];
      if (event.crit) parts.push('A critical hit!');
      if (event.effectiveness === 0) parts.push(`It doesn't affect ${label(names, event.side, event.index, true)}…`);
      else if (event.effectiveness > 1) parts.push("It's super effective!");
      else if (event.effectiveness < 1) parts.push("It's not very effective…");
      return parts.length ? say(next, parts.join(' ')) : next;
    }
    case 'recoil':
      return say({ ...view, hp: withSide(view.hp, event.side, event.index, event.hpAfter) },
        `${label(names, event.side, event.index)} is hit with recoil!`);
    case 'stat': {
      const cur = view.stages[event.side][event.index];
      const next = { ...view, stages: withSide(view.stages, event.side, event.index, { ...cur, [event.stat]: cur[event.stat] + event.applied }) };
      const up = event.change > 0;
      const how = event.applied === 0 ? (up ? "won't go any higher!" : "won't go any lower!")
        : Math.abs(event.applied) >= 2 ? (up ? 'sharply rose!' : 'harshly fell!') : (up ? 'rose!' : 'fell!');
      return say(next, `${label(names, event.side, event.index)}'s ${STAT_NAMES[event.stat]} ${how}`);
    }
    case 'withdraw': {
      const next = { ...view, stages: withSide(view.stages, event.side, event.index, ZERO_STAGES) };
      return say(next, event.side === 'A' ? `${names.A[event.index]}, come back!` : `RIVAL withdrew ${names.B[event.index]}!`);
    }
    case 'faint':
      return say({ ...view, fainted: withSide(view.fainted, event.side, event.index, true) },
        `${label(names, event.side, event.index)} fainted!`);
    case 'end':
      return say({ ...view, winner: event.winner }, event.winner === 'A' ? 'You won the battle!' : 'You lost the battle…');
  }
}
