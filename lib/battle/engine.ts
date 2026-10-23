import { rollDamage, type Combatant } from './damage';
import { chooseMove, STRUGGLE } from './moves';
import { createRng, type Rng } from './rng';
import { applyStage, hitChance, statMultiplier, ZERO_STAGES, type Stages } from './stages';
import { statsAtLevel50 } from './stats';
import { isStatMove, type BattleEvent, type Side, type TeamMember } from './types';

export const TURN_CAP = 500;
const DEFAULT_PP = 5; // old cached data has no pp field

interface Fighter { member: TeamMember; combatant: Combatant; hp: number; maxHp: number; pp: number[]; stages: Stages; form: string | null }

const other = (side: Side): Side => (side === 'A' ? 'B' : 'A');

function toFighter(member: TeamMember): Fighter {
  const stats = statsAtLevel50(member.pokemon.baseStats);
  return {
    member, combatant: { types: member.pokemon.types, stats }, hp: stats.hp, maxHp: stats.hp,
    pp: member.moves.map(m => m.pp ?? DEFAULT_PP), stages: ZERO_STAGES, form: null,
  };
}

const speed = (f: Fighter) => Math.floor(f.combatant.stats.spe * statMultiplier(f.stages.spe));

function turnOrder(a: Fighter, b: Fighter, rng: Rng): Side[] {
  const sa = speed(a), sb = speed(b);
  if (sa !== sb) return sa > sb ? ['A', 'B'] : ['B', 'A'];
  return rng() < 0.5 ? ['A', 'B'] : ['B', 'A'];
}

const hpFraction = (team: Fighter[]) =>
  team.reduce((s, f) => s + f.hp, 0) / team.reduce((s, f) => s + f.maxHp, 0);

// Out of moves or out of PP: Struggle is the only option.
const struggling = (f: Fighter) => f.pp.every(p => p <= 0);

export function createBattle(teamA: TeamMember[], teamB: TeamMember[], seed: number) {
  if (teamA.length === 0 || teamB.length === 0) throw new Error('Both teams need at least one Pokémon');

  const rng = createRng(seed);
  const sides: Record<Side, Fighter[]> = { A: teamA.map(toFighter), B: teamB.map(toFighter) };
  const active: Record<Side, number> = { A: 0, B: 0 };
  const damageDealt: Record<Side, number[]> = { A: teamA.map(() => 0), B: teamB.map(() => 0) };
  const events: BattleEvent[] = [];
  const pending: Side[] = []; // sides that must choose a replacement before play continues

  const switchIn = (side: Side) => {
    const f = sides[side][active[side]];
    events.push({ kind: 'switchIn', side, index: active[side], hp: f.hp, maxHp: f.maxHp });
  };
  switchIn('A');
  switchIn('B');

  let turn = 0;
  let ended = false;
  let actors: { side: Side; index: number }[] = [];
  const advance = () => {
    actors = actors.filter(actor => sides[actor.side][actor.index].hp > 0 && active[actor.side] === actor.index);
    if (ended || pending.length || actors.length) return;
    if (turn >= TURN_CAP) {
      const winner: Side = hpFraction(sides.A) >= hpFraction(sides.B) ? 'A' : 'B';
      events.push({ kind: 'end', winner, reason: 'turnCap', damageDealt });
      ended = true;
      return;
    }
    turn++;
    // The player always opens the battle; speed decides every later round.
    const order: Side[] = turn === 1 ? ['A', 'B'] : turnOrder(sides.A[active.A], sides.B[active.B], rng);
    // A replacement cannot act in the round in which its teammate fainted.
    actors = order.map(side => ({ side, index: active[side] }));
  };
  advance();

  const canSwapTo = (side: Side, index: number) => {
    const f = sides[side][index];
    return !!f && f.hp > 0 && index !== active[side];
  };
  const bringIn = (side: Side, index: number) => {
    active[side] = index;
    sides[side][index].stages = ZERO_STAGES;
    switchIn(side);
  };
  const turnOf = (side: Side) => !ended && !pending.length && actors[0]?.side === side;

  return {
    initialEvents: [...events],
    get nextSide(): Side | null { return ended || pending.length ? null : actors[0].side; },
    get replacing(): Side | null { return ended ? null : pending[0] ?? null; },
    get ended() { return ended; },
    get turn() { return turn; },
    ppLeft: (side: Side, index: number) => [...sides[side][index].pp],
    stages: (side: Side, index: number): Stages => sides[side][index].stages,
    /** The Mega (or Primal) form a Pokémon has taken, or null. */
    form: (side: Side, index: number) => sides[side][index].form,
    bestMove() {
      const { side, index } = actors[0];
      const attacker = sides[side][index];
      if (struggling(attacker)) return STRUGGLE.name;
      const usable = attacker.member.moves.filter((_, i) => attacker.pp[i] > 0);
      const damaging = usable.filter(m => !isStatMove(m));
      if (!damaging.length) return usable[0].name;
      return chooseMove(damaging, attacker.combatant, sides[other(side)][active[other(side)]].combatant).name;
    },
    /** Plays `side`'s move; with `mega` (one of its Mega forms) the Pokémon Mega Evolves first. Any number of Pokémon may Mega Evolve, each once. */
    playMove(side: Side, moveName: string, mega?: string): BattleEvent[] {
      if (!turnOf(side)) return [];
      const { index } = actors[0];
      const attacker = sides[side][index];
      const foeSide = other(side);
      const foeIndex = active[foeSide];
      const defender = sides[foeSide][foeIndex];
      const form = mega === undefined ? undefined : attacker.member.pokemon.megas?.find(f => f.name === mega);
      if (mega !== undefined && (!form || attacker.form)) return [];

      let move = STRUGGLE;
      let ppLeft = STRUGGLE.pp;
      if (struggling(attacker)) {
        if (moveName !== STRUGGLE.name) return [];
      } else {
        const slot = attacker.member.moves.findIndex((m, i) => m.name === moveName && attacker.pp[i] > 0);
        if (slot === -1) return [];
        move = attacker.member.moves[slot];
        ppLeft = --attacker.pp[slot];
      }

      const start = events.length;
      actors.shift();
      if (form) {
        // The new types and stats count from this attack (Speed from the next round); HP stays, as in the games.
        attacker.form = form.name;
        attacker.combatant = { types: form.types, stats: { ...statsAtLevel50(form.baseStats), hp: attacker.maxHp } };
        events.push({ kind: 'mega', side, index, form: form.name });
      }
      events.push({ kind: 'useMove', side, index, move, ppLeft });

      const selfTarget = isStatMove(move) && move.target === 'self';
      if (!selfTarget && move.accuracy !== null
        && rng() >= hitChance(move.accuracy, attacker.stages.accuracy, defender.stages.evasion)) {
        events.push({ kind: 'miss', side, index });
        advance();
        return events.slice(start);
      }

      if (isStatMove(move)) {
        const [targetSide, targetIndex] = selfTarget ? [side, index] : [foeSide, foeIndex];
        const target = sides[targetSide][targetIndex];
        for (const { stat, change } of move.statChanges ?? []) {
          const result = applyStage(target.stages, stat, change);
          target.stages = result.stages;
          events.push({ kind: 'stat', side: targetSide, index: targetIndex, stat, change, applied: result.applied });
        }
        advance();
        return events.slice(start);
      }

      const roll = rollDamage(move, attacker.combatant, defender.combatant, rng, { attacker: attacker.stages, defender: defender.stages });
      const amount = Math.min(roll.amount, defender.hp);
      defender.hp -= amount;
      damageDealt[side][index] += amount;
      events.push({
        kind: 'damage', side: foeSide, index: foeIndex, amount,
        hpAfter: defender.hp, effectiveness: roll.effectiveness, crit: roll.crit,
      });

      if (move.name === STRUGGLE.name) {
        const recoil = Math.min(attacker.hp, Math.max(1, Math.floor(attacker.maxHp / 4)));
        attacker.hp -= recoil;
        events.push({ kind: 'recoil', side, index, amount: recoil, hpAfter: attacker.hp });
      }

      const down = ([[foeSide, foeIndex], [side, index]] as const).filter(([s, i]) => sides[s][i].hp === 0);
      for (const [s, i] of down) events.push({ kind: 'faint', side: s, index: i });
      const wiped = (s: Side) => sides[s].every(f => f.hp === 0);
      // If both teams fall to Struggle recoil, the attacker wins.
      const winner = wiped(foeSide) ? side : wiped(side) ? foeSide : null;
      if (winner) {
        events.push({ kind: 'end', winner, reason: 'knockout', damageDealt });
        ended = true;
        return events.slice(start);
      }
      for (const [s] of down) pending.push(s);
      advance();
      return events.slice(start);
    },
    switchTo(side: Side, index: number): BattleEvent[] {
      if (!turnOf(side) || !canSwapTo(side, index)) return [];
      const start = events.length;
      actors.shift();
      events.push({ kind: 'withdraw', side, index: active[side] });
      sides[side][active[side]].stages = ZERO_STAGES;
      bringIn(side, index);
      advance();
      return events.slice(start);
    },
    replace(side: Side, index: number): BattleEvent[] {
      if (ended || pending[0] !== side || !canSwapTo(side, index)) return [];
      const start = events.length;
      pending.shift();
      bringIn(side, index);
      advance();
      return events.slice(start);
    },
  };
}

export type Battle = ReturnType<typeof createBattle>;

/** Sends in the first healthy Pokémon for the side that must replace a fainted one. */
export function replaceFirstHealthy(battle: Battle, teamSize: number): BattleEvent[] {
  const side = battle.replacing;
  if (!side) return [];
  for (let i = 0; i < teamSize; i++) {
    const events = battle.replace(side, i);
    if (events.length) return events;
  }
  return [];
}

export function simulate(teamA: TeamMember[], teamB: TeamMember[], seed: number): BattleEvent[] {
  const battle = createBattle(teamA, teamB, seed);
  const size: Record<Side, number> = { A: teamA.length, B: teamB.length };
  const events = [...battle.initialEvents];
  while (!battle.ended) {
    const side = battle.replacing;
    if (side) events.push(...replaceFirstHealthy(battle, size[side]));
    else events.push(...battle.playMove(battle.nextSide!, battle.bestMove()));
  }
  return events;
}
