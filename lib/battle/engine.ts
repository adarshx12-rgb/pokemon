import { rollDamage, type Combatant } from './damage';
import { chooseMove, STRUGGLE } from './moves';
import { createRng, type Rng } from './rng';
import { statsAtLevel50 } from './stats';
import type { BattleEvent, Side, TeamMember } from './types';

export const TURN_CAP = 500;

interface Fighter { member: TeamMember; combatant: Combatant; hp: number; maxHp: number }

const other = (side: Side): Side => (side === 'A' ? 'B' : 'A');

function toFighter(member: TeamMember): Fighter {
  const stats = statsAtLevel50(member.pokemon.baseStats);
  return { member, combatant: { types: member.pokemon.types, stats }, hp: stats.hp, maxHp: stats.hp };
}

function turnOrder(a: Fighter, b: Fighter, rng: Rng): Side[] {
  const sa = a.combatant.stats.spe, sb = b.combatant.stats.spe;
  if (sa !== sb) return sa > sb ? ['A', 'B'] : ['B', 'A'];
  return rng() < 0.5 ? ['A', 'B'] : ['B', 'A'];
}

const hpFraction = (team: Fighter[]) =>
  team.reduce((s, f) => s + f.hp, 0) / team.reduce((s, f) => s + f.maxHp, 0);

export function simulate(teamA: TeamMember[], teamB: TeamMember[], seed: number): BattleEvent[] {
  if (teamA.length === 0 || teamB.length === 0) throw new Error('Both teams need at least one Pokémon');

  const rng = createRng(seed);
  const sides: Record<Side, Fighter[]> = { A: teamA.map(toFighter), B: teamB.map(toFighter) };
  const active: Record<Side, number> = { A: 0, B: 0 };
  const damageDealt: Record<Side, number[]> = { A: teamA.map(() => 0), B: teamB.map(() => 0) };
  const events: BattleEvent[] = [];

  const switchIn = (side: Side) => {
    const f = sides[side][active[side]];
    events.push({ kind: 'switchIn', side, index: active[side], hp: f.hp, maxHp: f.maxHp });
  };
  switchIn('A');
  switchIn('B');

  for (let turn = 1; turn <= TURN_CAP; turn++) {
    // Actors are fixed at the start of the turn, so a Pokémon that switches in mid-turn does not act.
    const actors = turnOrder(sides.A[active.A], sides.B[active.B], rng).map(side => ({ side, index: active[side] }));

    for (const { side, index } of actors) {
      const attacker = sides[side][index];
      if (attacker.hp === 0) continue;

      const foeSide = other(side);
      const foeIndex = active[foeSide];
      const defender = sides[foeSide][foeIndex];
      const moves = attacker.member.moves.length ? attacker.member.moves : [STRUGGLE];
      const move = chooseMove(moves, attacker.combatant, defender.combatant);
      events.push({ kind: 'useMove', side, index, move });

      if (move.accuracy !== null && rng() * 100 >= move.accuracy) {
        events.push({ kind: 'miss', side, index });
        continue;
      }

      const roll = rollDamage(move, attacker.combatant, defender.combatant, rng);
      const amount = Math.min(roll.amount, defender.hp);
      defender.hp -= amount;
      damageDealt[side][index] += amount;
      events.push({
        kind: 'damage', side: foeSide, index: foeIndex, amount,
        hpAfter: defender.hp, effectiveness: roll.effectiveness, crit: roll.crit,
      });

      if (defender.hp === 0) {
        events.push({ kind: 'faint', side: foeSide, index: foeIndex });
        const next = sides[foeSide].findIndex(f => f.hp > 0);
        if (next === -1) {
          events.push({ kind: 'end', winner: side, reason: 'knockout', damageDealt });
          return events;
        }
        active[foeSide] = next;
        switchIn(foeSide);
      }
    }
  }

  const winner: Side = hpFraction(sides.A) >= hpFraction(sides.B) ? 'A' : 'B';
  events.push({ kind: 'end', winner, reason: 'turnCap', damageDealt });
  return events;
}
