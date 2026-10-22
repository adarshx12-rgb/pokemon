# SoulSilver-style Showdown Battle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `/showdown` battle into a SoulSilver-style DS two-screen battle with real Gen 4 mechanics (stat stages, PP, Struggle recoil, switching, Gen 4 crits, level-50 movesets) and HGSS-style animations, with sound hooks but no audio.

**Architecture:** `lib/battle` stays a pure, event-emitting engine. New mechanics add engine actions (`playMove`, `switchTo`, `replace`) and event kinds. The UI (`components/showdown/ds/*`) plays events one at a time: text box, sprite animation, HP drain. Pure helpers (drain math, menu state, effect mapping, cues) live in `lib/` so they get node unit tests. The React components are covered by Playwright.

**Tech Stack:** Next.js (repo version, see `AGENTS.md`), React 19, CSS modules, Vitest (node environment), Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-23-soulsilver-battle-design.md`

## Global Constraints

- No audio of any kind. Sound only through `battleCue(cue, detail?)`, which does nothing by default.
- Gen 4 rules: crit chance 1/16, crit ×2; stages −6..+6; stat multiplier `(2+n)/2` up, `2/(2-n)` down; accuracy/evasion `(3+n)/3` and `3/(3-n)`; Struggle 50 power, never misses, typeless, recoil `floor(maxHp/4)` (min 1).
- Level 50, 31 IVs, 0 EVs, neutral nature. Unchanged.
- Turn 1 always starts with side `A`; later rounds use speed (with stages), ties use the rng.
- Status conditions, abilities, items, weather and move priority are out of scope.
- HP drain: constant rate, a full bar empties in `1500` ms. Colour green `> 50%`, yellow `> 20%`, red `≤ 20%`.
- Messages (exact): `"RIVAL sent out X!"`, `"Go! X!"`, `"What will X do?"`, `"X used MOVE!"`, `"The foe's X used MOVE!"`, `"A critical hit!"`, `"It's super effective!"`, `"It's not very effective…"`, `"It doesn't affect X…"`, `"X fainted!"`, `"X's attack missed!"`, `"X's ATTACK rose!"` / `"sharply rose!"` / `"won't go any higher!"` / `"fell!"` / `"harshly fell!"` / `"won't go any lower!"`, `"X is hit with recoil!"`, `"X, come back!"`. Side B names carry the prefix `"The foe's "` everywhere except in send-out messages.
- Stat display names: `ATTACK`, `DEFENSE`, `SP. ATK`, `SP. DEF`, `SPEED`, `ACCURACY`, `EVASIVENESS`.
- Keep the page `h1`, `metadata` and `ShowdownGuide`. Keep teams built in the side panels.
- Bottom screen must render as layout `'ds'` (below the top screen) or `'side'` (beside it, Fight menu always open) from one `layout` prop.
- `prefers-reduced-motion`: no throw/pop/effect animations; HP drain capped at 300 ms.
- Port 3000 on this machine runs another app (pm2). Run Playwright with `PLAYWRIGHT_PORT=3200`.

## Review Focus

1. **Fainted active Pokémon while the other side is mid-round.** If A faints B's active, the engine must wait for `replace('B', i)` before anyone moves, and the replacement must not act that round. Pinned in Task 3 (`waits for a replacement before the next action`).
2. **Every move at 0 PP, or a member with an empty moveset.** The Fight menu must offer only Struggle, never an empty menu or a dead end. Pinned in Task 3 (`falls back to Struggle when out of PP`) and Task 7 (e2e `offers Struggle when no PP is left`).
3. **Stat changes at the cap.** +6 must produce "won't go any higher!" with no stage change, and a crit must ignore the attacker's negative Attack stages and the defender's positive Defense stages. Pinned in Task 2.
4. **Old cached API responses without `pp` and `levels`.** A response missing the new fields must not crash: `pp` defaults to `5`, and missing levels fall back to `autoMoveset`. Pinned in Task 1 (`normalizes responses missing the new fields`), Task 3 (`defaults missing PP to 5`) and Task 4.
5. **Tapping fast during playback.** Taps on the text box during an animation skip to the end of that step, never skip a step or double-apply an event; menu buttons are inert while events play. Pinned in Task 8 (e2e `skip finishes the step without losing events`).

---

### Task 1: Move and sprite data

**Files:**
- Modify: `lib/battle/types.ts`, `lib/pokeapi/normalize.ts`, `lib/pokeapi/client.ts`, `scripts/snapshot-pokedex.ts`, `app/api/pokemon/[name]/route.ts`, `lib/showdown/loadMember.ts`
- Regenerate: `data/pokedex-snapshot.json`
- Test: `lib/pokeapi/normalize.test.ts`, `lib/pokeapi/client.test.ts`

**Interfaces:**
- Produces in `lib/battle/types.ts`:
  - `export type DamageClass = 'physical' | 'special' | 'status'`
  - `export type StageStat = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'accuracy' | 'evasion'`
  - `export interface StatChange { stat: StageStat; change: number }`
  - `Move` gains `pp: number`, `statChanges?: StatChange[]`, `target?: 'self' | 'foe'`, `level?: number` (level-up level in the chosen version group; absent when not learned by level-up). For stat moves `power` is `0` and `damageClass` is `'status'`.
  - `export const isStatMove = (m: Move) => m.damageClass === 'status'`
- Snapshot tuple becomes `[type, power, accuracy, damageClass, pp, category, target, statChanges]`, where `statChanges` is `[statName, change][]`.
- `normalizeMove(raw: RawMove): Move | null` accepts stat moves only when `meta.category.name === 'net-good-stats'` and every stat change maps to a `StageStat`. Target `'user'` maps to `'self'`, anything else to `'foe'`. PokéAPI stat names: `attack, defense, special-attack, special-defense, speed, accuracy, evasion`.
- `levelUpLevels(raw: RawPokemon): Map<string, number>`. Version group preference: `heartgold-soulsilver`, then `scarlet-violet, sword-shield, ultra-sun-ultra-moon, sun-moon, omega-ruby-alpha-sapphire, x-y, black-2-white-2, black-white`. Use the first group in which the species has any level-up entry. Level 0 counts as level 1.
- `pixelSprites(id: number): { front: string | null; back: string | null }`: HGSS URL `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/{back/}{id}.png` for `id ≤ 493`, Black/White `.../versions/generation-v/black-white/{back/}{id}.png` for `494–649`, otherwise `null` (the caller keeps the current Showdown sprite).
- Client fetches `/api/pokemon/${name}?v=2`. The route's edge cache key becomes `https://pokefame.com/api/pokemon/v2/${slug}`.

- [ ] **Step 1: Write failing tests** in `normalize.test.ts`:
  - `keeps pure stat moves with pp, target and stat changes`: raw Growl (`pp 40`, target `all-opponents`, category `net-good-stats`, `[{change:-1, stat:{name:'attack'}}]`) → `{ name:'growl', power:0, damageClass:'status', pp:40, target:'foe', statChanges:[{stat:'atk', change:-1}] }`. Swords Dance (`user`, `+2 attack`) → `target:'self'`.
  - `drops status moves that do more than change stats`: category `ailment` (Thunder Wave) → `null`.
  - `prefers HGSS level-up levels, then the newest version group`: a species with HGSS level-up `ember@10` and SV `ember@7` → `level 10`. A species with only SV data → SV levels. Level 0 → 1.
  - `uses HGSS, then BW pixel sprites`: id 6 → HGSS front/back URLs; id 500 → BW URLs; id 700 → keeps the Showdown sprite.
  - `normalizes responses missing the new fields`: a move without `pp` → `pp: 5`.
- [ ] **Step 2: Run** `npx vitest run lib/pokeapi`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the types, `normalizeMove`, `levelUpLevels`, `pixelSprites`, and `normalizePokemon` (set `level` on pool moves, sprites `front/back` from `pixelSprites` when non-null). Extend `RawMove` with `pp`, `target`, `meta`, `stat_changes`, and `snapshotMove` to read the longer tuple. Update the snapshot script to write it. Bump the client URL and edge cache key.
- [ ] **Step 4: Regenerate the snapshot.** Run `npm run snapshot:pokedex`. Expected: `Wrote 1025 Pokémon and <~900+> moves`. Spot-check: `node -e "const s=require('./data/pokedex-snapshot.json');console.log(s.moves.growl)"` prints a tuple with `40` and `[["attack",-1]]`.
- [ ] **Step 5: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: all PASS. Fix existing tests whose `Move` fixtures now need `pp`. Test helpers may default `pp: 10`.
- [ ] **Step 6: Commit** `feat(showdown): move PP, stat moves, level-up levels and HGSS sprites in Pokémon data`.

### Task 2: Stat stages and Gen 4 damage

**Files:**
- Create: `lib/battle/stages.ts`, `lib/battle/stages.test.ts`
- Modify: `lib/battle/damage.ts`, `lib/battle/damage.test.ts`

**Interfaces:**
- Consumes: `StageStat`, `StatChange` (Task 1).
- Produces:
  - `export type Stages = Record<StageStat, number>`; `export const ZERO_STAGES: Stages`
  - `export function statMultiplier(stage: number): number`, i.e. `(2+n)/2` or `2/(2-n)`
  - `export function accuracyMultiplier(stage: number): number`, i.e. `(3+n)/3` or `3/(3-n)`
  - `export function applyStage(stages: Stages, stat: StageStat, change: number): { stages: Stages; applied: number }`, clamped to ±6; `applied` is the real change (0 at the cap).
  - `export function hitChance(accuracy: number | null, attackerAcc: number, defenderEva: number): number`, which returns 1 for `null`, otherwise `accuracy/100 × accuracyMultiplier(clamp(acc − eva, −6, 6))`.
  - `export const CRIT_CHANCE = 1 / 16`, crit multiplier `2`.
  - `rollDamage(move, attacker, defender, rng, stages?: { attacker: Stages; defender: Stages })`. Stages scale the attacking and defending stats. On a crit, attacker stages below 0 and defender stages above 0 count as 0. Struggle (`name === 'struggle'`) uses effectiveness 1 and no STAB.

- [ ] **Step 1: Write failing tests**:
  - `statMultiplier`: `0→1`, `1→1.5`, `2→2`, `6→4`, `-1→2/3`, `-6→0.25`. `accuracyMultiplier(-1) = 0.75`, `(1) = 4/3`.
  - `applyStage` from `+5 atk` with `+2` → stage 6, `applied 1`; from `6` with `+1` → `applied 0`; from `-6` with `-1` → `applied 0`.
  - `hitChance(100, 0, 1)` → `0.75`; `hitChance(null, -6, 6)` → `1`.
  - damage: `crit doubles damage` (seeded rng forcing crit, compare to a non-crit roll with the same random factor). `crit ignores the attacker's lowered Attack and the defender's raised Defense`. `+2 Attack doubles base damage`. `struggle is typeless`: against a Ghost type it deals damage with `effectiveness 1`.
- [ ] **Step 2: Run** `npx vitest run lib/battle`. Expected: FAIL.
- [ ] **Step 3: Implement** `stages.ts` and the `damage.ts` changes. `expectedDamage` takes the same optional stages.
- [ ] **Step 4: Run** `npx vitest run lib/battle`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(battle): Gen 4 crits, stat stages and accuracy stages`.

### Task 3: Engine — PP, stat moves, Struggle recoil, switching, replacements

**Files:**
- Modify: `lib/battle/types.ts` (events), `lib/battle/engine.ts`, `lib/battle/engine.test.ts`, `lib/battle/moves.ts` (`STRUGGLE` gains `pp: 1`)

**Interfaces:**
- Consumes: Task 2's `Stages`, `applyStage`, `hitChance`, `statMultiplier`, `rollDamage`.
- New `BattleEvent` kinds:
  - `{ kind: 'stat'; side; index; stat: StageStat; change: number; applied: number }` (side/index is the Pokémon whose stat changes)
  - `{ kind: 'recoil'; side; index; amount: number; hpAfter: number }`
  - `{ kind: 'withdraw'; side; index }`
  - `useMove` gains `ppLeft: number`.
- `createBattle` return value gains:
  - `get replacing(): Side | null`: set after a faint while the fainted side still has healthy Pokémon; `nextSide` is `null` meanwhile.
  - `get ended(): boolean`
  - `ppLeft(side: Side, index: number): number[]`, aligned with `member.moves`
  - `switchTo(side: Side, index: number): BattleEvent[]`: valid only for `nextSide === side`, a healthy non-active `index`; emits `withdraw` and `switchIn`, resets that Pokémon's stages, uses the actor's turn.
  - `replace(side: Side, index: number): BattleEvent[]`: valid only when `replacing === side`; emits `switchIn`; the replacement does not act in the current round.
  - `playMove` works out Struggle by itself: if the actor has no moves or all PP is 0, only `'struggle'` is accepted. A stat move emits `stat` events (`target: 'self'` → actor, `'foe'` → defender), and accuracy applies to foe-targeted stat moves.
- `simulate` loops `while (!battle.ended)`: if `replacing`, it calls `replace` with the first healthy index; else `playMove(nextSide, bestMove())`. `bestMove` ignores stat moves and moves with 0 PP.
- Speed for turn order uses `statMultiplier(stages.spe)`. Turn 1 stays `['A', 'B']`.

- [ ] **Step 1: Write failing tests** in `engine.test.ts`:
  - `spends PP and reports what is left`: a move with `pp 2` → `useMove.ppLeft` 1 then 0; a third use is rejected (`[]`).
  - `falls back to Struggle when out of PP`: all PP 0 → `playMove(side, 'tackle')` returns `[]`, `playMove(side, 'struggle')` emits `useMove`, `damage` and `recoil` with `amount = floor(maxHp/4)`.
  - `applies stat moves to the right Pokémon`: Growl → `stat` event on the foe `{stat:'atk', change:-1, applied:-1}`; Swords Dance → on self, `applied 2`; at +6 → `applied 0`.
  - `speed stages change later turn order`: a slower A uses Agility (`spe +2`) on turn 1; on turn 2 A acts first.
  - `switching uses the turn and resets stages`: A switches to index 1 → `withdraw` and `switchIn` events, `nextSide` becomes B, and switching back shows stages reset (verify through `bestMove` damage or an exposed `stages(side, index)` getter, also produced: `stages(side: Side, index: number): Stages`).
  - `waits for a replacement before the next action`: a KO with B's backups → `replacing === 'B'`, `nextSide === null`, `playMove` rejected; `replace('B', 2)` emits `switchIn` index 2, and the replacement does not act until the next round.
  - `defaults missing PP to 5`: a member whose move has no `pp` field (old cached data) → `ppLeft` is `[5]`.
  - Keep the existing tests passing. Update the KO test so it calls `replace` where it used to rely on auto switch-in.
- [ ] **Step 2: Run** `npx vitest run lib/battle/engine.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** in `engine.ts`. Keep the per-actor round model and the 500-turn cap.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS. `components/showdown` may fail type-checking on new event kinds; add exhaustive `case`s that do nothing yet, for Task 8 to fill in.
- [ ] **Step 5: Commit** `feat(battle): PP, stat moves, Struggle recoil, switching and chosen replacements`.

### Task 4: Level-50 default movesets

**Files:**
- Modify: `lib/battle/moves.ts`, `lib/battle/moves.test.ts`, `lib/showdown/loadMember.ts`

**Interfaces:**
- Produces: `export function levelMoveset(pool: Move[], types: TypeName[], level = 50): Move[]`. From pool moves with `move.level !== undefined && move.level <= level`, sorted by `level` ascending (stable for ties, in pool order), it takes the last four. If none qualify, it returns `autoMoveset(pool, types)`.
- `loadMember` uses `levelMoveset`.

- [ ] **Step 1: Write failing tests**:
  - `takes the last four level-up moves at or below 50`: levels `[1 tackle, 1 growl, 9 ember, 15 smokescreen, 28 flamethrower, 46 flare-blitz, 54 inferno]` → `['ember','smokescreen','flamethrower','flare-blitz']`.
  - `includes stat moves`: the result above contains `smokescreen`.
  - `falls back to autoMoveset without level data`.
- [ ] **Step 2: Run** `npx vitest run lib/battle/moves.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(battle): default movesets are the moves known at level 50`.

### Task 5: Battle view, messages and pacing

**Files:**
- Modify: `lib/battle/view.ts`, `lib/battle/view.test.ts`, `lib/battle/pacing.ts`, `lib/battle/pacing.test.ts`

**Interfaces:**
- Consumes: Task 3 events.
- `BattleView` gains `pp: Record<Side, number[][]>` (per member, per move) and `stages: Record<Side, Stages[]>`.
- `applyEvent` produces the exact messages in Global Constraints. Side B uses `"The foe's X"`; send-out messages are `"RIVAL sent out X!"` and `"Go! X!"`. Stat message: `applied` of 1 → `rose!`/`fell!`, ≥2 → `sharply rose!`/`harshly fell!`, 0 → `won't go any higher!`/`won't go any lower!` (by the sign of `change`). `withdraw` → `"X, come back!"` (side A) or `"RIVAL withdrew X!"` (side B).
- `pacing.ts` produces: `export const FULL_DRAIN_MS = 1500`; `export function drainMs(amount: number, maxHp: number, reduced = false): number` returns `FULL_DRAIN_MS × amount/maxHp`, capped at 300 when `reduced`; `eventDelay(event: BattleEvent, message, speed, maxHp?)` (now takes the event): for `damage` and `recoil` it adds `drainMs` to the base duration.
- Produces `export function hpColor(hp: number, maxHp: number): 'green' | 'yellow' | 'red'` (in `view.ts`).

- [ ] **Step 1: Write failing tests**: one assertion per message rule above (B prefix, send-out wording, each stat wording, recoil, withdraw); `drainMs(50, 100) === 750`; `drainMs(100, 100, true) === 300`; `hpColor(51,100)='green'`, `(50,100)='yellow'`, `(21,100)='yellow'`, `(20,100)='red'`.
- [ ] **Step 2: Run** `npx vitest run lib/battle`. Expected: FAIL.
- [ ] **Step 3: Implement.** Update `BattleScreen.tsx`'s call to `eventDelay` so it compiles.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(battle): HGSS battle messages and HP-drain pacing`.

### Task 6: DS console, top screen and HP boxes

**Files:**
- Create: `components/showdown/ds/DsConsole.tsx`, `components/showdown/ds/TopScreen.tsx`, `components/showdown/ds/HpBox.tsx`, `components/showdown/ds/useHpDrain.ts`, `components/showdown/ds/ds.module.css`
- Modify: `components/showdown/PokemonSprite.tsx` (pixelated rendering; HGSS sprites are static PNGs)
- Delete when unused after Task 10: `Arena.tsx`, `HpPanel.tsx`
- Test: `e2e/showdown.spec.ts`

**Interfaces:**
- `DsConsole({ layout: 'ds' | 'side'; top: ReactNode; bottom: ReactNode; testId: string })`: the grey DS shell with a hinge; `'ds'` stacks the screens, `'side'` puts the bottom screen to the right (below on screens under 640 px).
- `TopScreen({ player?, opponent?, playerBox?, opponentBox?, message: ReactNode, overlay?, onAdvance?: () => void })`: 4:3 scene with sky, far platform top-right, near platform bottom-left, red-framed text box at the bottom (`data-testid="text-box"`, clicking calls `onAdvance`).
- `HpBox({ name, hp, maxHp, showNumbers, fainted: boolean[], side })`: shows a draining value from `useHpDrain(hp, maxHp)`. The progressbar `aria-valuenow` is the target `hp`, and the visible number (`data-testid="hp-number-{side}"`) is the draining value. Uses `hpColor`.
- `useHpDrain(target: number, maxHp: number): number` steps at `maxHp / FULL_DRAIN_MS` per ms via `requestAnimationFrame`, and jumps when `useReducedMotion()` and the gap would exceed 300 ms.

- [ ] **Step 1: Write a failing e2e test** `hp number counts down instead of jumping`. After the first hit, read `hp-number-B` twice 200 ms apart (using `page.clock`). The first read is above the final value and below the starting one; after `drainMs` it equals `aria-valuenow`.
- [ ] **Step 2: Run** `PLAYWRIGHT_PORT=3200 npx playwright test e2e/showdown.spec.ts -g "counts down"`. Expected: FAIL.
- [ ] **Step 3: Implement** the components, matching the approved mockup: `.superpowers/brainstorm/849-1792695347/content/battle-layout-v2.html`, option A (HP box layout, red text-box frame, platforms, hinge). Wire them into `BattleScreen` in place of `Arena` and `HpPanel`. Use `layout="ds"`.
- [ ] **Step 4: Run** the e2e test. Expected: PASS. Run `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 5: Commit** `feat(showdown): DS console, HGSS top screen and draining HP boxes`.

### Task 7: Bottom-screen menus

**Files:**
- Create: `lib/showdown/menu.ts`, `lib/showdown/menu.test.ts`, `components/showdown/ds/BottomScreen.tsx`
- Modify: `components/showdown/ds/ds.module.css`, `components/showdown/BattleScreen.tsx`

**Interfaces:**
- `lib/showdown/menu.ts`:
  - `export type MenuState = 'main' | 'fight' | 'party' | 'run' | 'replace'`
  - `export function menuFor(opts: { replacing: boolean; layout: 'ds' | 'side' }): MenuState` returns `'replace'` when replacing, `'fight'` for `'side'`, else `'main'`.
  - `export function fightOptions(moves: Move[], ppLeft: number[]): { move: Move; pp: number; disabled: boolean }[]` returns only Struggle (`pp 1`) when `moves` is empty or every `ppLeft` is 0.
- `BottomScreen({ side, layout, state, onState, member, team, hp, fainted, active, ppLeft, onMove, onSwitch, onReplace, onRun, disabled })`:
  - Header `data-testid="turn-label"`: `"YOUR TURN"` (A) or `"RIVAL'S TURN"` (B), with a per-side tint.
  - Main: `FIGHT` (`data-testid="menu-fight"`), `POKéMON` (`menu-pokemon`), `RUN` (`menu-run`).
  - Fight: move buttons `data-testid="move-{side}-{name}"` with type colour, name, type and `PP x/y`, plus `BACK`.
  - Party and replace: six slots `data-testid="party-{side}-{i}"` with sprite, HP bar and FAINTED label; the active slot and fainted slots are disabled. Replace preselects the first healthy slot and has no BACK.
  - Run: `"Give up the battle?"` with `YES` (`run-yes`) and `NO`.
  - All buttons are inert while `disabled` (events playing).

- [ ] **Step 1: Write failing unit tests** for `menuFor` and `fightOptions` (all-zero PP → Struggle only; one move at 0 → that option disabled).
- [ ] **Step 2: Run** `npx vitest run lib/showdown`. Expected: FAIL.
- [ ] **Step 3: Implement** `menu.ts` and `BottomScreen`, then wire them into `BattleScreen` (FIGHT → moves; POKéMON → `battle.switchTo`; replace state when `battle.replacing`; RUN YES → `onEdit`).
- [ ] **Step 4: Write e2e tests**: `fight menu opens moves and back returns`, `switching from the POKéMON menu uses the turn` (turn label flips to RIVAL'S TURN), `run returns to the builder`, `offers Struggle when no PP is left` (mock a Pokémon with one move at `pp 1`, use it twice in a row on its turns, expect `move-A-struggle`).
- [ ] **Step 5: Run** `npx vitest run` and `PLAYWRIGHT_PORT=3200 npx playwright test e2e/showdown.spec.ts`. Expected: the new tests PASS.
- [ ] **Step 6: Commit** `feat(showdown): DS touch menus for fight, party switch, replacement and run`.

### Task 8: Battle playback — intro, send-out, effects, faint, skip, cues

**Files:**
- Create: `lib/showdown/cues.ts`, `lib/showdown/cues.test.ts`, `lib/showdown/fx.ts`, `lib/showdown/fx.test.ts`, `components/showdown/ds/BattleFx.tsx`, `components/showdown/ds/fx.module.css`
- Modify: `components/showdown/BattleScreen.tsx`

**Interfaces:**
- `cues.ts`:
  - `export type Cue = 'ballThrow' | 'ballOpen' | 'cry' | 'moveUse' | 'hit' | 'superEffective' | 'notVeryEffective' | 'crit' | 'statUp' | 'statDown' | 'faint' | 'lowHp' | 'menuSelect' | 'menuBack' | 'victory' | 'defeat'`
  - `export function battleCue(cue: Cue, detail?: { pokemon?: string; type?: TypeName }): void`
  - `export function setCueHandler(handler: ((cue: Cue, detail?) => void) | null): void`. The default handler does nothing.
- `fx.ts`:
  - `export type FxStyle = 'contact' | 'projectile' | 'stat-up' | 'stat-down'`
  - `export function fxFor(move: Move, applied?: number): FxStyle`: physical → `contact`, special → `projectile`, status → by the sign of the change.
  - `export const TYPE_FX: Record<TypeName, { color: string; shape: 'flame' | 'splash' | 'bolt' | 'leaf' | 'shard' | 'wisp' | 'orb' | 'rock' | 'wind' | 'star' }>` covers all 18 types.
- `BattleFx({ style, type, from: Side })` renders the overlay on the top screen.
- Playback order in `BattleScreen` (each step is one event; the text box and the animation run together):
  - On mount: screen flash → scene slide-in → the B send-out (ball arcs to the far platform, white flash, Pokémon scales up from a white silhouette, HP box slides in) → the A send-out. These are animations around the engine's two initial `switchIn` events.
  - `useMove` → lunge (contact) or projectile; `damage` → target blink then drain; `stat` → glow and arrows; `faint` → sprite sinks below the platform, HP box slides out; `withdraw` → sprite shrinks into a red glow.
  - Clicking `text-box` finishes the current step (completes the typing, jumps the drain, ends the animation) and waits for the next event's normal timing. Events are never skipped.
  - Cues fire at: throw, open, cry (after pop-out), moveUse, hit, superEffective/notVeryEffective/crit (with the message), statUp/statDown, faint, lowHp (when HP first crosses ≤ 20%), menuSelect/menuBack (from `BottomScreen`), victory/defeat.
  - Reduced motion: no throw, pop, lunge or projectile; the sprite simply appears; the drain is capped (Task 5).

- [ ] **Step 1: Write failing unit tests**: `battleCue` calls the handler set with `setCueHandler` and does nothing without one; `fxFor` for physical, special, status ±; `TYPE_FX` has all 18 `TYPE_NAMES`.
- [ ] **Step 2: Run** `npx vitest run lib/showdown`. Expected: FAIL.
- [ ] **Step 3: Implement** `cues.ts`, `fx.ts`, `BattleFx`, and the playback in `BattleScreen`.
- [ ] **Step 4: Write e2e tests**: `opening sends out both Pokémon with ball throws` (text box shows `RIVAL sent out` then `Go!`; `[data-testid="pokeball-throw-B"]` appears before `arena-pokemon-B`); `skip finishes the step without losing events` (tap the text box five times during the first attack; the final `aria-valuenow` and message sequence match an un-tapped run with the same mocked seed, since `Date.now` is set by `page.clock`); `reduced motion shows no throw` (`page.emulateMedia({ reducedMotion: 'reduce' })`, the throw element never appears).
- [ ] **Step 5: Run** `npx vitest run` and `PLAYWRIGHT_PORT=3200 npx playwright test e2e/showdown.spec.ts`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(showdown): HGSS send-out, per-type attack effects, faint animation and sound cues`.

### Task 9: Builder preview, result screen and page wiring

**Files:**
- Modify: `components/showdown/Showdown.tsx`, `components/showdown/ResultScreen.tsx`, `components/showdown/TeamPanel.tsx`, `components/showdown/showdown.module.css`
- Delete: `components/showdown/Arena.tsx`, `components/showdown/HpPanel.tsx` (once unused)

**Interfaces:**
- Build phase: `DsConsole testId="arena-preview"`. Top screen shows the leads' sprites and HP boxes with the existing prompts. The bottom screen shows the FIGHT button (`data-testid="battle-start"`, disabled until both teams have a Pokémon) and RESET. Team panels stay beside it, unchanged except for the moves.
- `classic` defaults to `true` (pixel sprites). The toggle stays.
- `ResultScreen` renders inside `DsConsole testId="result"`: top screen with the winner's sprite and text `"RIVAL was defeated!"` (A won) or `"You were defeated!"`. The bottom screen shows each side's MVP and damage bars with `REMATCH` and `EDIT TEAMS`. Keep `data-testid="result-banner"` on the top-screen message.
- `TeamPanel` move options: stat moves show `(—)` instead of power, and every option shows `PP n`. Grouping by learn method is unchanged.

- [ ] **Step 1: Update e2e tests** to the new flow: the empty preview has no sprites and `battle-start` is disabled; after adding teams, `battle-start` → battle; `finishBattle` uses `menu-fight` then `move-*`, handles `party-*` replacement prompts, then expects `result-banner` to match `/was defeated/`; rematch and edit still work. Add `pp: 10` to the mocked `movePool` moves.
- [ ] **Step 2: Run** `PLAYWRIGHT_PORT=3200 npx playwright test e2e/showdown.spec.ts`. Expected: FAIL on the result and preview assertions.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, and the full Showdown e2e file. Expected: PASS.
- [ ] **Step 5: Commit** `feat(showdown): DS builder preview and result screen, pixel sprites by default`.

### Task 10: Copy, phone layout and final verification

**Files:**
- Modify: `components/showdown/Showdown.tsx` ("How the battle works"), `components/showdown/ShowdownGuide.tsx`, `app/showdown/page.tsx` (meta description if it mentions moves), `components/showdown/ds/ds.module.css`
- Test: `e2e/showdown.spec.ts`, `e2e/seo.spec.ts`

**Interfaces:** none new.

- [ ] **Step 1: Write failing e2e tests**: `phone shows both screens without scrolling during battle` (390×844: during battle `text-box` and `menu-fight` are both in the viewport, and `document.documentElement.scrollWidth <= 390`); `side layout fallback renders moves beside the screen` (render with `?layout=side`, a dev-only query param read in `Showdown.tsx`, and expect `move-A-*` buttons visible without tapping FIGHT).
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the phone CSS and the `?layout=side` switch. Rewrite the rules copy and guide paragraphs to cover: you make the opening move and speed decides later rounds; PP and Struggle; stat-changing moves; critical hits as in HGSS; switching via POKéMON and choosing a replacement after a faint; default moves are the ones known at level 50, changeable in the builder; still no status conditions, abilities, items, weather or priority.
- [ ] **Step 4: Run** `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, `PLAYWRIGHT_PORT=3200 npx playwright test e2e/showdown.spec.ts e2e/seo.spec.ts`. Expected: all PASS. Take desktop and phone screenshots of build, battle and result for the user.
- [ ] **Step 5: Commit** `feat(showdown): phone layout, side-layout fallback and updated battle guide`.
