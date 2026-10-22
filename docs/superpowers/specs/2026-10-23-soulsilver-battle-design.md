# SoulSilver-style Showdown battle — design

Date: 2026-10-23 · Branch: `feat/pokemon-vault` · Page: `/showdown`

## Intent

Make the Showdown battle look, move and play like Pokémon SoulSilver (HGSS, Nintendo DS) so that people
enjoy watching a fight and keep playing. The hook, in the user's words, is "the battle animations and
sounds, like the real game", and battles that behave like the real games: HP that drains smoothly and
can sit at 1–5 HP, instead of every Pokémon going from full to fainted in 2–3 hits.

## Goals

1. **DS two-screen battle (layout A, chosen by the user).** Top screen: the battle scene. Bottom screen:
   the touch menu. On phones the two screens stack, like holding a DS.
2. **SoulSilver look.** Sky and grass platforms, real HGSS pixel sprites, white HP boxes, red-framed
   text box with typed messages.
3. **Real battle flow and animations:** Poké Ball throw → ball opens → Pokémon pops out; per-type attack
   animations; faint animation; HP bar that drains at a steady rate with the number counting down.
4. **Real-game mechanics so fights last a realistic number of hits.** The length depends on moves,
   matchups and situation, as in the games.
5. **Sound-ready.** The user will add sounds separately. Ship named hook points, no audio.

## Non-goals

- Any audio: no music, no SFX, no cries. Hooks only.
- Status conditions (burn, poison, paralysis, sleep, freeze, confusion), abilities, held items, weather,
  move priority, double battles, online play.
- A unique animation per move. Animations are per type and per attack style (decided by the user).
- Changing where teams are built. Teams are still built in the panels beside the screen (user).
- Higgsfield art and the cobalt/red/white palette from the old plan (superseded).

## Anti-goals (failure even if it works)

- Using Nintendo's audio, or ripped game graphics other than the PokéAPI sprites the site already uses.
- Battles where 1–2 hit KOs are the norm again.
- A battle that feels draggy: animations must never block a player who wants to go faster.
- Losing the page's SEO: the `h1`, metadata, and the server-rendered `ShowdownGuide` stay.

## Constraints

- Next.js in this repo is a newer version than usual. Read `node_modules/next/dist/docs/` before
  touching routing or data code (see `AGENTS.md`).
- `lib/battle` is a pure, tested engine with no UI. Keep it that way. The UI plays its events.
- Pokémon data comes from `/api/pokemon/[name]`, which is cached at the Cloudflare edge for a week by slug,
  and move definitions come from the bundled `data/pokedex-snapshot.json`. Any change to the response
  shape must change the edge cache key (for example a `v2` path segment) or old cached responses will be
  served for a week.
- Already decided and kept: the player's Pokémon always makes the first move of the battle (turn 1).
  Speed decides every later round.
- No new runtime dependencies for animation. CSS and small React state are enough.
- `prefers-reduced-motion`: skip throws and effects, keep the HP drain short.

## What the user decided

- Layout A, two DS screens. **Keep layout B (one screen, moves always beside it) as a fallback** if A
  feels slow in real testing. Build the bottom screen so it can switch to B with a layout change, not a
  rewrite.
- Teams are built outside the DS screen, in the existing panels.
- Per-type attack animations are enough.
- No sounds from us. Hooks only.
- Battles should take roughly as many hits as the real game, varying with attacks, matchups and situation.

## The design

### 1. Screens and menus

**Top screen.** 4:3 scene: sky, far platform top-right (opponent), near platform bottom-left (player, seen
from behind). Opponent HP box top-left (name, Lv50, bar). Player HP box bottom-right (name, Lv50, bar,
`HP/maxHP` number, decorative EXP strip). Red-framed text box along the bottom that types messages.
Clicking or tapping the text box finishes the current message or animation at once (the "A button").

**Bottom screen.** Dark patterned panel with a turn label on top, "YOUR TURN" or "RIVAL'S TURN", and a
slight colour tint per side, because one person controls both teams. Menu states:

- **Main:** large **FIGHT** button, and below it **POKéMON** and **RUN**.
  *Builder's call, flagged to the user:* the earlier playback had TEAM and SWITCH as separate buttons;
  the real game has one POKéMON button that shows the party and lets you switch, so they merge.
- **Fight:** four move buttons coloured by type, each showing name, type and `PP x/y`, plus a BACK button.
  A move with 0 PP is disabled. If every move is at 0 PP, the only option is Struggle.
- **Pokémon:** the six party slots with sprite, HP bar and status (fainted). Picking a healthy, non-active
  Pokémon switches it in and uses the turn. BACK returns to Main.
- **Run:** asks "Give up the battle?" YES returns to the team builder, NO goes back.

**Layout B fallback.** The same bottom-screen component rendered beside the top screen with the Fight state
always open. Only CSS and one prop should change.

**Phones.** Screens stack top over bottom. Both fit in one phone viewport without scrolling during a battle.

**Result.** *Builder's call:* stays in the DS frame. Top screen shows the winner's sprite and the text
"RIVAL was defeated!" or "You were defeated!". Bottom screen shows each team's MVP and damage dealt, with
REMATCH and EDIT TEAMS buttons. The large gold VICTORY/DEFEAT page goes.

**Sprites.** HGSS sprites from PokéAPI (`versions.generation-iv.heartgold-soulsilver` front and back) for
national dex 1–493. Black/White sprites (`generation-v.black-white`) for 494–649. The current Showdown
sprites for 650 and up. Pixelated rendering. The existing "HD artwork / Classic sprites" toggle stays.
*Builder's call:* pixel sprites become the default.

### 2. Battle flow and animations

Every step plays an engine event. The text box message and the animation run together.

1. **Intro:** a screen flash, then the scene slides in.
2. **Send out:** "RIVAL sent out AZUMARILL!" A Poké Ball arcs onto the far platform, opens with a white
   flash, and the Pokémon grows out of a white silhouette into full colour. Then "Go! CHARIZARD!" and the
   same on the near side. The HP box slides in after each Pokémon.
3. **Turn:** "What will CHARIZARD do?" The bottom screen opens on Main.
4. **Move:** "CHARIZARD used FLAMETHROWER!"
   - Physical move: the attacker lunges toward the target, then a type-coloured impact bursts on the target.
   - Special move: a type-coloured projectile or beam crosses the screen. Each type has its own look, for
     example fire flickers, water splashes, electric crackles, grass leaves, ice shards, ghost wisps.
     One animation per type, 18 in all, used by both damage classes for the impact.
   - Stat move: the affected Pokémon glows and arrows rise (stat up) or fall (stat down).
5. **Hit:** the target blinks, then the HP bar drains. Then, when it applies, "A critical hit!",
   "It's super effective!", "It's not very effective…", "It doesn't affect AZUMARILL…".
6. **HP drain:** the bar moves at a constant rate. A full bar takes about 1.5 s to empty, so a small hit
   trickles and a big hit drains for longer. The HP number counts down in step with it. The colour is green
   above 50%, yellow above 20%, red at or below 20%.
7. **Faint:** "AZUMARILL fainted!" The sprite sinks down out of the platform and the HP box slides out.
   The next Pokémon is sent out with step 2.
8. **Stat messages:** "CHARIZARD's ATTACK rose!", "sharply rose!", "won't go any higher!", "fell!",
   "harshly fell!", "won't go any lower!".
9. **Miss:** "CHARIZARD's attack missed!"

Clicking or tapping the text box skips to the end of the current step.

### 3. Mechanics (engine, `lib/battle`)

These follow Gen 4 (HGSS) rules.

- **Stats:** level 50, 31 IVs, 0 EVs, neutral nature. Unchanged.
- **Damage:** the existing Gen 4 formula, with Gen 4 crits: 1/16 chance, ×2 damage. A crit ignores the
  attacker's negative Attack stages and the defender's positive Defense stages.
- **Stat stages:** −6 to +6 for Attack, Defense, Sp. Atk, Sp. Def and Speed, with multiplier `(2+n)/2` or
  `2/(2-n)`. Accuracy and evasion stages use `(3+n)/3` or `3/(3-n)`. Stages reset when a Pokémon switches
  out. Speed stages count when ordering later rounds.
- **Stat moves:** moves whose only effect is changing stats, for example Growl, Leer, Tail Whip, Harden,
  Swords Dance, Sand Attack, Smokescreen, Double Team, Agility. Data comes from PokéAPI `stat_changes` and
  `target`. Other status moves stay out.
- **PP:** each move starts at its PokéAPI PP, which lasts for the battle. Struggle when every move is at 0:
  50 power, never misses, typeless (no STAB, neutral against every type, as in Gen 4). The user loses 1/4
  of its max HP as recoil, with the message "CHARIZARD is hit with recoil!". This needs a new recoil event.
- **Switching:** a switch uses the actor's place in the round, which fits the existing one-actor-at-a-time
  engine. A Pokémon that was switched in can be hit later in the same round.
- **Replacing a fainted Pokémon.** *Builder's call, flagged to the user:* as in the real game, the bottom
  screen opens the POKéMON menu so the player picks who comes in next. That applies to both sides, since one
  person controls both. The next Poké Ball in the lineup is preselected, so tapping straight through keeps
  the current "next ball enters" behaviour. The replacement still cannot act in the round its teammate
  fainted.
- **First move:** turn 1 always starts with the player, as already built.
- **Default movesets:** the last four level-up moves learned at or below level 50, as the games give wild
  and trainer Pokémon. Use the `heartgold-soulsilver` learnset when the species has one, otherwise the most
  recent version group that does. Only moves the engine supports count (damaging moves not on the
  excluded list, plus stat moves). If fewer than four qualify, the Pokémon has fewer moves.
  The builder still lets players change any move to anything in the species' learnset.

### 4. Data

- Regenerate `data/pokedex-snapshot.json` with the extra move fields: PP, `stat_changes`, `target`.
  Keep it compact.
- Extend the `/api/pokemon/[name]` response with each move's PP, stat changes, target, and level-up
  levels per version group (only what default movesets need). Add the HGSS and BW sprite URLs.
- Bump the edge cache key in `app/api/pokemon/[name]/route.ts` so old responses are never mixed with new
  ones. The client cache in `lib/showdown/loadMember.ts` is in memory only, so a reload clears it.
- Move levels: PokéAPI reports evolution and "remember" moves as level 0 or 1. Count them as learned
  (level ≤ 50).

### 5. Sound hooks

One function, `battleCue(cue, detail?)`, called from the battle UI, which does nothing for now. Cues:
`ballThrow`, `ballOpen`, `cry` (with the Pokémon), `moveUse` (with type), `hit`, `superEffective`,
`notVeryEffective`, `crit`, `statUp`, `statDown`, `faint`, `lowHp`, `menuSelect`, `menuBack`, `victory`,
`defeat`. The user will plug audio in here.

### 6. Copy and SEO

Update "How the battle works" and `ShowdownGuide` for PP, stat moves, Gen 4 crits, switching and
level-50 movesets. Keep the `h1`, metadata and guide structure.

## Left to the builder

- Exact animation timings, easing and the look of each of the 18 type effects, within the brief above.
- Component split and file names, matching the existing `components/showdown` style (CSS modules).
- How the HP drain is driven (requestAnimationFrame or CSS), as long as the number stays in step.
- Which stat moves are excluded when their data is ambiguous (moves with side effects beyond stats).

## Testing

- Unit tests in `lib/battle` for crits, stat stages and caps, crit/stage interaction, PP and Struggle,
  switching, stage reset, speed with stages, default moveset selection, and the player opening move.
- `e2e/showdown.spec.ts` updated for the new flow: add teams → FIGHT → choose a move → HP drains →
  faint → send-out → result. Also POKéMON switch, RUN, reduced motion, and a phone viewport with both
  screens visible and no horizontal scroll.
