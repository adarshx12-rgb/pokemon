import type { Move, Side, TeamMember } from '@/lib/battle/types';

export const MAX_TEAM = 6;
export type Teams = Record<Side, TeamMember[]>;
export const EMPTY_TEAMS: Teams = { A: [], B: [] };

export type TeamsAction =
  | { type: 'add'; side: Side; member: TeamMember }
  | { type: 'remove'; side: Side; index: number }
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
    case 'setMove':
      return {
        ...state,
        [action.side]: team.map((m, i) =>
          i === action.index ? { ...m, moves: m.moves.map((mv, s) => (s === action.slot ? action.move : mv)) } : m),
      };
    case 'fillRandom': {
      const base = team.length >= MAX_TEAM ? [] : team;
      return { ...state, [action.side]: [...base, ...action.members].slice(0, MAX_TEAM) };
    }
  }
}
