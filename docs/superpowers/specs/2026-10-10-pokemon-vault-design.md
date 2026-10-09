# Pokémon Vault — Design Spec

**Date:** 2026-10-10
**Status:** Draft for review

## 1. Purpose

A showcase-quality website (Awwwards-level visuals and motion) for Pokémon fans, with two features:

1. **Card Vault** — a curated collection of Pokémon TCG cards ranked from rarest to most common, with live estimated prices and a guide to identifying a card's value.
2. **Showdown** — a 6v6 auto-battle between Pokémon teams, decided by stats and type matchups, presented in the style of the Gen 2 (Gold/Silver) battle screen, rebuilt in high quality.

**Primary goal:** portfolio/showcase piece — visual polish comes first.
**Secondary goal:** the data layer must use live APIs so the site can later grow into a real collector tool (searching any card) without a rewrite.

### Success criteria
- The home, ranking, card detail, and showdown pages load fast (statically generated where possible) and feel smooth at 60fps on a modern laptop.
- Card prices come from live market data and refresh at least daily.
- A user can build two 6-Pokémon teams (or randomize the opponent) and watch a complete battle to a result screen.
- The battle engine is deterministic given a seed and covered by unit tests.

### Out of scope (YAGNI)
User accounts, saved collections, user-owned card tracking, searching all cards, multiplayer battles, status moves/abilities/items/weather, a database.

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS with CSS-variable design tokens |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll, Framer Motion for component/route transitions |
| Card data + prices | Pokémon TCG API (`api.pokemontcg.io/v2`) — includes TCGplayer & Cardmarket prices |
| Pokémon data | PokéAPI (`pokeapi.co/api/v2`) — stats, types, moves, sprites |
| Unit tests | Vitest |
| E2E smoke tests | Playwright |
| Hosting | Vercel |

An optional `POKEMONTCG_API_KEY` environment variable raises the rate limit; the site works without it.

## 3. Architecture

```
app/
  page.tsx                 # Home / hero
  cards/page.tsx           # Rarity ranking (ISR, revalidate 24h)
  cards/[id]/page.tsx      # Card detail (ISR, revalidate 24h)
  showdown/page.tsx        # Team builder + battle (client-heavy)
  api/pokemon/[name]/route.ts  # Cached proxy: normalized Pokémon data for the battle
data/
  showcase.ts              # Curated card IDs (~30–50) + editorial notes
  typeChart.ts             # 18×18 type-effectiveness table
  rarity.ts                # Rarity → tier mapping and tier order
lib/
  tcg/                     # Pokémon TCG API client + normalizers (Card, Price)
  pokeapi/                 # PokéAPI client + normalizers (BattlePokemon, Move)
  battle/                  # Pure battle engine (no React, no fetch)
    engine.ts              # simulate(teamA, teamB, seed) → BattleEvent[]
    damage.ts              # damage formula
    moves.ts               # auto-select 4 moves, best-move choice
    rng.ts                 # seeded PRNG
components/
  motion/                  # Lenis provider, page-transition curtain, cursor
  cards/                   # TiltCard, TierBand, PricePanel, IdentifyGuide
  showdown/                # TeamBuilder, Slot, PokemonSearch, BattleScreen, HpPanel, TextBox, ResultScreen
```

**Boundaries:**
- `lib/battle` is pure TypeScript. It takes normalized `BattlePokemon` objects and a seed, and returns an ordered list of `BattleEvent`s. It knows nothing about the UI or the network.
- `BattleScreen` is a **player** for that event list: it animates events one at a time and supports play/pause, 1×/2×/4× speed, and skip. Because the whole battle is computed up front, Skip simply jumps to the final state.
- `lib/tcg` and `lib/pokeapi` are the only modules that call external APIs. They return normalized types, so UI code never touches raw API shapes.

## 4. Data

### 4.1 Card showcase
`data/showcase.ts` holds about 30–50 Pokémon TCG API card IDs spread across every rarity tier: iconic grails (Base Set 1st Edition Charizard, Gold Star cards, Special Illustration Rares, etc.) down to commons for contrast. Each entry may carry an optional editorial note ("Why it's valuable").

Note: some famous cards (e.g. Pikachu Illustrator, a promo) may not exist in the API or have no price. The curated list will include only cards that the API returns with price data. This is checked by a script (`scripts/verify-showcase.ts`) that reports missing IDs or prices.

### 4.2 Rarity ranking
The API's `rarity` strings are mapped in `data/rarity.ts` to ordered tiers:

1. **Grail** — Special Illustration Rare, Hyper Rare, Secret Rare, Rare Rainbow, Gold Star, Shining
2. **Ultra** — Illustration Rare, Ultra Rare, Rare Holo V/VMAX/VSTAR/EX/GX, Double Rare
3. **Holo** — Rare Holo
4. **Rare** — Rare
5. **Uncommon**
6. **Common**

Any unknown rarity string falls into the closest tier by keyword, otherwise **Rare**. Inside a tier, cards are sorted by market price, highest first.

### 4.3 Price
Shown price = TCGplayer `market` for the card's main variant (holofoil → 1stEditionHolofoil → reverseHolofoil → normal, using the first one present), falling back to Cardmarket `averageSellPrice`. Low and high values, the source, and the `updatedAt` date are shown. Prices are always labeled **"Estimated"**.

### 4.4 Pokémon for battle
`/api/pokemon/[name]` fetches the PokéAPI Pokémon plus its move details and returns a normalized `BattlePokemon`:
`{ id, name, types[], baseStats{hp,atk,def,spa,spd,spe}, sprites{front, back, artwork}, movePool: Move[] }`, where `Move = { name, type, power, accuracy, damageClass: 'physical'|'special' }`. Status moves and moves with no power are filtered out. Responses are cached (`revalidate` 7 days).

Sprites: Showdown animated GIFs (`sprites.other.showdown.front_default/back_default`) where present; otherwise the static front/back sprite; otherwise official artwork.

The search autocomplete uses one cached list of all Pokémon names (`/pokemon?limit=2000`).

## 5. Pages & visual design

### 5.1 Design tokens
- Background `#0A0A0A`, surface `#141414`, border `#2A2418`
- Gold gradient `#D4AF37 → #F5D77A → #8C6B1F` with a metallic sheen
- Text `#EDE6D6`, muted text `#8A8375`
- Tier accents: Grail = animated gold foil, Ultra = platinum, Holo = silver, Rare/Uncommon/Common = progressively muted greys
- Fonts: **Cormorant Garamond** (headings), **Inter** (body), **Press Start 2P** (battle text)

### 5.2 Global motion
- Lenis smooth scroll
- A custom cursor (gold ring that grows over interactive elements; hidden on touch devices)
- A gold curtain-wipe transition between routes
- **`prefers-reduced-motion`:** turns off tilt, parallax, particles, and curtains, and makes battle animations instant cuts. Text still types out, but faster.

### 5.3 Home `/`
A hero with one featured card (default: Base Set Charizard) floating in 3D with cursor-driven tilt, a holographic foil shine, and drifting gold particles. The headline appears letter by letter. Below that are two scroll-revealed feature panels, "The Vault" and "Showdown", each linking to its page.

### 5.4 Ranking `/cards`
A vertical "vault descent": one full-width band per tier, in tier order. Each band shows a large gold serif label and a grid of cards. Each card shows its image, name, set, rarity badge, and estimated price. Hovering a card gives it a tilt and shimmer. Clicking opens the detail page. A sticky tier index on the side shows the current tier while scrolling.

### 5.5 Card detail `/cards/[id]`
- Left: a large card with tilt and foil effects.
- Right: name, set, number, rarity tier, and the **price panel** (market / low / high, source, updated date).
- **"How to Identify Value"** guide: rarity symbol, set symbol and card number, 1st Edition stamp (vintage sets), holo pattern/variant, and condition and grading (raw vs PSA 9/10, what affects grade). Hovering a guide item highlights the matching region on the card image. Region coordinates are generic per card layout era (vintage / modern), not per card.
- The card's editorial note, if present.

### 5.6 Showdown `/showdown`
**Team builder**
- Two panels — **Your Team** and **Opponent** — each with 6 gold-framed slots.
- Pokémon search with autocomplete. Clicking a result adds it to the next empty slot of the active panel. Each slot shows the sprite, type badges, a mini stat radar, and a remove button.
- Each Pokémon automatically gets 4 moves (see 6.3). The user can swap any of them via a dropdown of its damaging move pool.
- Opponent panel: a **Randomize** button fills its empty slots (or all slots if none are empty) with random Pokémon. The user can also pick opponents by hand.
- A **matchup preview** strip summarizes type advantages between the two teams.
- **Battle!** is enabled when both teams have 1–6 Pokémon. Six each is the intended mode, but fewer is allowed.
- All Pokémon battle at **level 50**.

**Battle screen** (Gen 2 layout, high-quality rendering)
- Enemy: sprite top-right; name/level/HP-bar panel top-left.
- Player: back sprite bottom-left; name/level/HP bar plus `current/max` HP panel bottom-right.
- Text box at the bottom with a typewriter effect: "`X` used `MOVE`!", "It's super effective!", "It's not very effective…", "It doesn't affect `Y`…", "A critical hit!", "`Y` fainted!", "Go! `Z`!"
- Effects: the attacker lunges, a flash tinted with the move's type color, the target shakes, and HP bars drain smoothly with color shifting green → yellow (≤50%) → red (≤20%). Super-effective hits and crits get a stronger shake. A fainted Pokémon drops out of view, and the next one slides in.
- Pokéball indicators show each team's remaining Pokémon.
- Panels use black surfaces with gold frames.
- Controls: Play/Pause, 1×/2×/4× speed, Skip to result.

**Result screen**
A gold **VICTORY** / **DEFEAT** banner from the user's perspective, an MVP for each side (most damage dealt), a per-Pokémon damage breakdown, plus **Rematch** (same teams, new seed) and **Edit teams**.

## 6. Battle engine

### 6.1 Stats at level 50
Base stats are converted with IV 31, EV 0, neutral nature:
- HP = `floor((2·B + 31) · 50 / 100) + 50 + 10`
- Other stats = `floor((2·B + 31) · 50 / 100) + 5`

### 6.2 Turn
1. Each active Pokémon picks its move (6.3).
2. The one with higher Speed acts first. A Speed tie is broken by the RNG.
3. Accuracy check: a hit if `rng() * 100 < accuracy` (moves with null accuracy always hit). A miss emits "`X`'s attack missed!"
4. Damage (6.4) is applied. HP is clamped at 0.
5. If the target faints, it is replaced by the next non-fainted Pokémon in its team order, and that Pokémon does **not** act this turn.
6. The battle ends when one team has no Pokémon left. Safety cap: 500 turns, after which the side with the higher total remaining-HP percentage wins.

### 6.3 Move choice
- **Auto-assigned moveset:** from the damaging move pool, pick the 4 moves with the highest `power × accuracy/100 × (STAB ? 1.5 : 1)`, preferring type variety (at most 2 moves of the same type).
- **In battle:** each turn, use the move with the highest *expected* damage against the current opponent (the formula below without randomness or crits, × accuracy).

### 6.4 Damage
```
base = floor(floor(floor(2·50/5 + 2) · Power · A / D) / 50) + 2
damage = floor(base · STAB · Type · Crit · Random)
```
- A/D = Atk/Def for physical moves, SpA/SpD for special moves
- STAB = 1.5 if the move type matches one of the attacker's types
- Type = product of multipliers against each defender type (0, 0.25, 0.5, 1, 2, 4)
- Crit = 1.5 with probability 1/24
- Random = uniform integer in [85, 100] / 100
- Minimum damage is 1 unless Type = 0

### 6.5 Output
`simulate(teamA, teamB, seed)` returns `BattleEvent[]`, a discriminated union: `switchIn`, `useMove`, `miss`, `damage {amount, hpAfter, effectiveness, crit}`, `faint`, `end {winner, stats}`. The result screen's MVP and damage breakdown come from the `end` event.

## 7. Error handling
- **TCG API down at revalidation:** ISR keeps serving the last good page. The price panel shows its `updatedAt` date so staleness is visible.
- **Card with no price data:** shows "Price unavailable" and sorts last in its tier.
- **PokéAPI failure in the team builder:** a gold toast "Couldn't reach the Pokédex" with a Retry button. The slot stays empty.
- **Missing sprite:** falls back as described in 4.4. A Pokémon with no damaging moves gets **Struggle** (Normal, 50 power, physical).
- **Unknown route / card ID:** a styled 404 page.

## 8. Testing
- **Vitest (battle engine):** level-50 stat formula, type chart lookups including dual types and immunities, damage formula against hand-computed cases, turn order and speed ties, accuracy/miss, faint and switch-in (incoming Pokémon doesn't act), battle end and the turn cap, auto moveset selection, best-move choice, and determinism (same seed gives the same events).
- **Vitest (data):** rarity-to-tier mapping, price variant selection and fallback.
- **Playwright smoke:** each page renders; build two teams (one randomized), run a battle, skip to the result, and see the result screen.

## 9. Future (not in this build)
Search any card, saved collections, price history charts, manual move selection mode, user accounts.
