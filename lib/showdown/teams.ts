import type { Move, Side, TeamMember } from '@/lib/battle/types';

export const MAX_TEAM = 6;
export type Teams = Record<Side, TeamMember[]>;
export const EMPTY_TEAMS: Teams = { A: [], B: [] };

export type TeamsAction =
  | { type: 'add'; side: Side; member: TeamMember }
  | { type: 'remove'; side: Side; index: number }
  | { type: 'reorder'; side: Side; from: number; to: number }
  | { type: 'clear'; side: Side }
  | { type: 'setMove'; side: Side; index: number; slot: number; move: Move }
  | { type: 'fillRandom'; side: Side; members: TeamMember[] };

export function randomFillCount(team: TeamMember[]): number {
  return team.length >= MAX_TEAM ? MAX_TEAM : MAX_TEAM - team.length;
}

export function teamsReducer(state: Teams, action: TeamsAction): Teams {
  const team = state[action.side];
  switch (action.type) {
    case 'add':
      return team.length >= MAX_TEAM ? state : { ...state, [action.side]: [...team, action.member] };
    case 'remove':
      return { ...state, [action.side]: team.filter((_, i) => i !== action.index) };
    case 'clear':
      return { ...state, [action.side]: [] };
    case 'reorder': {
      const { from, to } = action;
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to ||
          from < 0 || to < 0 || from >= team.length || to >= team.length) return state;
      const reordered = [...team];
      reordered.splice(to, 0, reordered.splice(from, 1)[0]);
      return { ...state, [action.side]: reordered };
    }
    case 'setMove': {
      const member = team[action.index];
      if (!member || !Number.isInteger(action.slot) || action.slot < 0 || action.slot >= member.moves.length) return state;
      const learnedMove = member.pokemon.movePool.find(move => move.name === action.move.name);
      if (!learnedMove || member.moves.some((move, slot) => slot !== action.slot && move.name === learnedMove.name)) return state;
      return {
        ...state,
        [action.side]: team.map((m, i) =>
          i === action.index ? { ...m, moves: m.moves.map((mv, s) => (s === action.slot ? learnedMove : mv)) } : m),
      };
    }
    case 'fillRandom': {
      if (action.members.length === 0) return state;
      const base = team.length >= MAX_TEAM ? [] : team;
      return { ...state, [action.side]: [...base, ...action.members].slice(0, MAX_TEAM) };
    }
  }
}
