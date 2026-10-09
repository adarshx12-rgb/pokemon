# Pokémon Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a black-and-gold, Awwwards-style Next.js site with a rarity-ranked Pokémon card vault (live estimated prices + value-identification guide) and a 6v6 auto-battle "Showdown" rendered in a high-quality Gen 2 battle layout.

**Architecture:** Next.js App Router. Server components fetch from the Pokémon TCG API with ISR (24h), and from PokéAPI through a cached route handler. The battle is a pure TypeScript engine (`lib/battle`): it takes two teams and a seed and returns an ordered event list. The React battle screen is only a player for that list. Motion uses GSAP + ScrollTrigger + Lenis, plus Framer Motion for the route curtain.

**Tech Stack:** Next.js 16.4 (App Router, TS), React 19, Tailwind CSS 4.3, GSAP 3.15, Lenis 1.3, Framer Motion 14.1, Vitest 5, Playwright, tsx. Node 24.

**Spec:** `docs/superpowers/specs/2026-10-10-pokemon-vault-design.md`

## Global Constraints

- Colors: background `#0A0A0A`, surface `#141414`, border `#2A2418`, gold `#D4AF37 → #F5D77A → #8C6B1F`, text `#EDE6D6`, muted `#8A8375`.
- Fonts: Cormorant Garamond (headings), Inter (body), Press Start 2P (battle text) — all via `next/font/google`.
- Prices are always labeled **"Estimated"**; card pages and the ranking use `revalidate = 86400`; Pokémon data is cached 7 days (`604800`).
- All Pokémon battle at **level 50** with IV 31, EV 0, neutral nature.
- Teams: 1–6 Pokémon per side; 6 is the default target.
- Battle turn cap: **500** turns; at the cap, the side with the higher total remaining-HP fraction wins (tie → side A).
- Crit chance **1/24**, crit multiplier **1.5**, STAB **1.5**, random factor integer **85–100** / 100, minimum damage **1** unless the type multiplier is 0.
- `prefers-reduced-motion: reduce` disables tilt, parallax, particles, curtain, and smooth scroll; battle animations become instant; text still types (faster).
- External APIs: `https://api.pokemontcg.io/v2` (optional `POKEMONTCG_API_KEY` env, header `X-Api-Key`), `https://pokeapi.co/api/v2`.
- Only `lib/tcg` and `lib/pokeapi` may call external APIs. `lib/battle` must not import React or call `fetch`.

## Review Focus

1. **Matchups where every move does 0 damage** (e.g. a Normal-only attacker vs a Ghost that only has Ghost moves): the battle must still end via the turn cap instead of hanging. Pinned in Task 4.
2. **Cards with no `tcgplayer` and no `cardmarket` prices:** they must show "Price unavailable" and sort last in their tier without crashing. Pinned in Task 6 (`selectPrice` + `groupByTier`).
3. **Unknown or `null` rarity strings from the TCG API** (`"Promo"`, `"Classic Collection"`, missing): they must land in a sensible tier, never throw. Pinned in Task 6.
4. **User-typed Pokémon names with caps, spaces, punctuation, or gender symbols** (`" Mr. Mime "`, `"Farfetch'd"`, `"Nidoran♀"`): they must resolve to PokéAPI slugs. Pinned in Task 7.
5. **Uneven team sizes** (1 vs 6): the battle runs and `damageDealt` arrays match each team's size. Pinned in Task 4.

---

## File Structure

```
app/
  layout.tsx                 fonts, shell (SmoothScroll, Cursor, SiteNav)
  template.tsx               gold curtain route transition
  globals.css                Tailwind theme tokens, utilities, battle keyframes
  not-found.tsx              styled 404
  page.tsx                   home (Hero + feature panels)
  cards/page.tsx             rarity ranking (ISR)
  cards/[id]/page.tsx        card detail (ISR)
  showdown/page.tsx          loads Pokémon name list, renders <Showdown/>
  api/pokemon/[name]/route.ts  normalized BattlePokemon JSON
data/
  typeChart.ts               18-type effectiveness
  typeColors.ts              type → hex color
  rarity.ts                  Tier, TIER_ORDER, TIER_META, rarityToTier
  showcase.ts                curated card IDs + notes
  identifyGuide.ts           value-guide items + card-region coordinates
lib/battle/
  types.ts  rng.ts  stats.ts  damage.ts  moves.ts  engine.ts  view.ts  (+ *.test.ts)
lib/tcg/
  types.ts  normalize.ts  rank.ts  client.ts  (+ tests)
lib/pokeapi/
  names.ts  normalize.ts  client.ts  (+ tests)
lib/showdown/
  teams.ts  matchup.ts  loadMember.ts  (+ tests)
components/motion/
  SmoothScroll.tsx  Cursor.tsx  Reveal.tsx  GoldParticles.tsx
components/
  SiteNav.tsx  TiltCard.tsx  TypeBadge.tsx
components/home/Hero.tsx
components/cards/
  CardTile.tsx  TierBand.tsx  TierIndex.tsx  PricePanel.tsx  CardInspector.tsx
components/showdown/
  Showdown.tsx  TeamPanel.tsx  PokemonSearch.tsx  StatRadar.tsx  MatchupPreview.tsx
  BattleScreen.tsx  HpPanel.tsx  TextBox.tsx  ResultScreen.tsx
scripts/verify-showcase.ts
e2e/smoke.spec.ts
vitest.config.ts  playwright.config.ts  next.config.ts
```

---

### Task 1: Scaffold, tooling, theme tokens

**Files:**
- Create: the Next.js scaffold (`package.json`, `tsconfig.json`, `app/*`, `.gitignore`, etc.)
- Create: `vitest.config.ts`, `lib/sanity.test.ts` (deleted at end of task)
- Modify: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `next.config.ts`, `package.json`

**Interfaces:**
- Produces: Tailwind colors `ink surface line gold gold-light gold-dark cream muted`, fonts `font-serif font-sans font-pixel`, utility classes `.text-gold-gradient .border-gold-frame .btn-gold .btn-ghost .eyebrow`. Path alias `@/*` → project root. Scripts `npm test`, `npm run e2e`, `npm run verify:showcase`.

- [ ] **Step 1: Initialize git and commit the spec**

The project folder already contains `.agents/`, `skills-lock.json`, and `docs/`, so scaffold into a temp folder and move it up.

```bash
cd D:/PROJECTS/pokemon
git init
git add docs
git commit -m "docs: add Pokémon Vault design spec and plan"
```

- [ ] **Step 2: Scaffold Next.js into a temp folder and move it in**

```bash
cd D:/PROJECTS/pokemon
npx create-next-app@16.4.0 .scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --skip-install --yes
cp -r .scaffold/. .
rm -rf .scaffold
npm install
npm install gsap@3.15.0 lenis@1.3.26 framer-motion@14.1.0
npm install -D vitest@5.0.3 @playwright/test tsx
```

Expected: `package.json` exists at the root and `node_modules/next` is installed.

- [ ] **Step 3: Add scripts to `package.json`**

Add these to `"scripts"` (keep the existing `dev`, `build`, `start`, `lint`):

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test",
"verify:showcase": "tsx scripts/verify-showcase.ts"
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
});
```

- [ ] **Step 5: Write a sanity test and run it**

`lib/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
describe('tooling', () => {
  it('runs', () => expect(1 + 1).toBe(2));
});
```

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-ink: #0a0a0a;
  --color-surface: #141414;
  --color-line: #2a2418;
  --color-gold: #d4af37;
  --color-gold-light: #f5d77a;
  --color-gold-dark: #8c6b1f;
  --color-cream: #ede6d6;
  --color-muted: #8a8375;
  --font-serif: var(--font-cormorant), Georgia, serif;
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-pixel: var(--font-press-start), monospace;
}

html { background: var(--color-ink); color: var(--color-cream); }
body { font-family: var(--font-sans); }
::selection { background: var(--color-gold); color: var(--color-ink); }

.text-gold-gradient {
  background: linear-gradient(135deg, #8c6b1f 0%, #d4af37 35%, #f5d77a 50%, #d4af37 65%, #8c6b1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.border-gold-frame {
  border: 1px solid var(--color-gold-dark);
  box-shadow: inset 0 0 0 1px rgba(245, 215, 122, 0.15), 0 0 24px rgba(212, 175, 55, 0.08);
}

@layer components {
  .btn-gold {
    @apply inline-flex items-center rounded-full bg-linear-to-r from-gold-dark via-gold to-gold-light px-7 py-3 text-sm font-semibold uppercase tracking-widest text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40;
  }
  .btn-ghost {
    @apply inline-flex items-center rounded-full border border-gold/50 px-7 py-3 text-sm uppercase tracking-widest text-gold-light transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40;
  }
  .eyebrow {
    @apply text-xs uppercase tracking-[0.4em] text-muted;
  }
}

@media (pointer: fine) {
  body.has-cursor, body.has-cursor * { cursor: none; }
}

/* Holographic foil overlay used by TiltCard */
.foil-overlay {
  position: absolute; inset: 0; border-radius: 4.5%; pointer-events: none;
  mix-blend-mode: color-dodge; opacity: 0.35;
  background:
    radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.55), transparent 45%),
    repeating-linear-gradient(115deg, #f5d77a 0%, #ff7eb3 8%, #7afcff 16%, #feff9c 24%, #f5d77a 32%);
  background-size: 100% 100%, 300% 300%;
  background-position: center, var(--mx, 50%) var(--my, 50%);
}

/* Battle effects */
@keyframes lunge-a { 50% { transform: translate(10%, -8%); } }
@keyframes lunge-b { 50% { transform: translate(-10%, 8%); } }
@keyframes shake {
  0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
}
@keyframes shake-strong {
  0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-14px, 4px); }
  40% { transform: translate(14px, -4px); } 60% { transform: translate(-10px, 2px); } 80% { transform: translate(10px, -2px); }
}
@keyframes hit-flash { 0% { opacity: 0; } 15% { opacity: 0.55; } 100% { opacity: 0; } }
@keyframes faint-drop { to { transform: translateY(60%); opacity: 0; } }
@keyframes slide-in-left { from { transform: translateX(-120%); opacity: 0; } }
@keyframes slide-in-right { from { transform: translateX(120%); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 7: Replace `app/layout.tsx` (shell components are added in Task 9)**

```tsx
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Press_Start_2P } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });

export const metadata: Metadata = {
  title: 'Pokémon Vault',
  description: 'Rare Pokémon cards ranked by rarity with estimated prices, and a stat-driven Pokémon Showdown.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${pixel.variable}`}>
      <body className="min-h-screen bg-ink text-cream antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Replace `app/page.tsx` with a token check and `next.config.ts` with image hosts**

`app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center">
      <h1 className="font-serif text-7xl text-gold-gradient">Pokémon Vault</h1>
    </main>
  );
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.pokemontcg.io' }] },
};

export default nextConfig;
```

- [ ] **Step 9: Verify the build and dev server**

Run: `npm run build`
Expected: build succeeds.
Run `npm run dev` and open http://localhost:3000.
Expected: gold-gradient serif "Pokémon Vault" on a near-black background. Stop the server.

- [ ] **Step 10: Delete the sanity test and commit**

```bash
rm lib/sanity.test.ts
git add -A
git commit -m "chore: scaffold Next.js with Tailwind theme tokens, fonts, and Vitest"
```

---

### Task 2: Battle primitives — types, seeded RNG, type chart, level-50 stats

**Files:**
- Create: `lib/battle/types.ts`, `lib/battle/rng.ts`, `data/typeChart.ts`, `data/typeColors.ts`, `lib/battle/stats.ts`
- Test: `lib/battle/rng.test.ts`, `data/typeChart.test.ts`, `lib/battle/stats.test.ts`

**Interfaces:**
- Produces:
  - `TYPE_NAMES`, `TypeName`, `DamageClass`, `Move`, `StatBlock`, `Sprites`, `BattlePokemon`, `TeamMember`, `Side`, `BattleEvent`, `EndEvent` (from `lib/battle/types.ts`)
  - `createRng(seed: number): Rng`, `randInt(rng: Rng, min: number, max: number): number`, `type Rng = () => number`
  - `typeMultiplier(attack: TypeName, defenders: TypeName[]): number`, `effectiveness(attack: TypeName, defend: TypeName): number`
  - `TYPE_COLORS: Record<TypeName, string>`
  - `statsAtLevel50(base: StatBlock): StatBlock`

- [ ] **Step 1: Create `lib/battle/types.ts`**

```ts
export const TYPE_NAMES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type TypeName = (typeof TYPE_NAMES)[number];
export type DamageClass = 'physical' | 'special';

export interface Move {
  name: string; // PokéAPI slug, e.g. "fire-blast"
  type: TypeName;
  power: number;
  accuracy: number | null; // null = never misses
  damageClass: DamageClass;
}

export interface StatBlock { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

export interface Sprites { front: string | null; back: string | null; artwork: string | null }

export interface BattlePokemon {
  id: number;
  name: string; // PokéAPI slug
  types: TypeName[];
  baseStats: StatBlock;
  sprites: Sprites;
  movePool: Move[]; // damaging moves only
}

export interface TeamMember { pokemon: BattlePokemon; moves: Move[] }

export type Side = 'A' | 'B';

export type BattleEvent =
  | { kind: 'switchIn'; side: Side; index: number; hp: number; maxHp: number }
  | { kind: 'useMove'; side: Side; index: number; move: Move }
  | { kind: 'miss'; side: Side; index: number }
  | { kind: 'damage'; side: Side; index: number; amount: number; hpAfter: number; effectiveness: number; crit: boolean }
  | { kind: 'faint'; side: Side; index: number }
  | { kind: 'end'; winner: Side; reason: 'knockout' | 'turnCap'; damageDealt: Record<Side, number[]> };

export type EndEvent = Extract<BattleEvent, { kind: 'end' }>;
```

In a `damage` event, `side`/`index` identify the **target**. In every other event they identify the actor.

- [ ] **Step 2: Write failing tests for RNG, type chart, and stats**

`lib/battle/rng.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createRng, randInt } from './rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42), b = createRng(42);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
  });
  it('differs for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
  it('returns values in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randInt', () => {
  it('stays within inclusive bounds and hits both ends', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(randInt(rng, 85, 100));
    expect(Math.min(...seen)).toBe(85);
    expect(Math.max(...seen)).toBe(100);
  });
});
```

`data/typeChart.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { effectiveness, typeMultiplier } from './typeChart';

describe('type chart', () => {
  it('handles super effective, resisted, neutral, and immune', () => {
    expect(effectiveness('fire', 'grass')).toBe(2);
    expect(effectiveness('fire', 'water')).toBe(0.5);
    expect(effectiveness('fire', 'normal')).toBe(1);
    expect(effectiveness('normal', 'ghost')).toBe(0);
    expect(effectiveness('electric', 'ground')).toBe(0);
    expect(effectiveness('dragon', 'fairy')).toBe(0);
  });
  it('multiplies across dual types', () => {
    expect(typeMultiplier('ice', ['dragon', 'flying'])).toBe(4);
    expect(typeMultiplier('fire', ['water', 'rock'])).toBe(0.25);
    expect(typeMultiplier('ground', ['electric', 'flying'])).toBe(0);
    expect(typeMultiplier('fighting', ['normal', 'ghost'])).toBe(0);
  });
});
```

`lib/battle/stats.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { statsAtLevel50 } from './stats';

describe('statsAtLevel50', () => {
  it('matches level-50 Charizard (IV 31, EV 0, neutral)', () => {
    expect(statsAtLevel50({ hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }))
      .toEqual({ hp: 153, atk: 104, def: 98, spa: 129, spd: 105, spe: 120 });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./rng`, `./typeChart`, `./stats`.

- [ ] **Step 4: Implement**

`lib/battle/rng.ts`:

```ts
export type Rng = () => number;

/** mulberry32 — small, fast, deterministic PRNG. Returns floats in [0, 1). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
```

`data/typeChart.ts`:

```ts
import type { TypeName } from '@/lib/battle/types';

type Row = { double?: TypeName[]; half?: TypeName[]; zero?: TypeName[] };

const CHART: Record<TypeName, Row> = {
  normal: { half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};

export function effectiveness(attack: TypeName, defend: TypeName): number {
  const row = CHART[attack];
  if (row.zero?.includes(defend)) return 0;
  if (row.double?.includes(defend)) return 2;
  if (row.half?.includes(defend)) return 0.5;
  return 1;
}

export function typeMultiplier(attack: TypeName, defenders: TypeName[]): number {
  return defenders.reduce((m, d) => m * effectiveness(attack, d), 1);
}
```

`data/typeColors.ts`:

```ts
import type { TypeName } from '@/lib/battle/types';

export const TYPE_COLORS: Record<TypeName, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C',
  ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3',
  psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};
```

`lib/battle/stats.ts`:

```ts
import type { StatBlock } from './types';

const IV = 31;
const LEVEL = 50;

const core = (base: number) => Math.floor(((2 * base + IV) * LEVEL) / 100);

export function statsAtLevel50(base: StatBlock): StatBlock {
  return {
    hp: core(base.hp) + LEVEL + 10,
    atk: core(base.atk) + 5,
    def: core(base.def) + 5,
    spa: core(base.spa) + 5,
    spd: core(base.spd) + 5,
    spe: core(base.spe) + 5,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add lib/battle data
git commit -m "feat(battle): add types, seeded RNG, type chart, and level-50 stats"
```

---

### Task 3: Damage formula and move selection

**Files:**
- Create: `lib/battle/damage.ts`, `lib/battle/moves.ts`
- Test: `lib/battle/damage.test.ts`, `lib/battle/moves.test.ts`

**Interfaces:**
- Consumes: `Move`, `StatBlock`, `TypeName` (Task 2), `typeMultiplier`, `Rng`, `randInt`.
- Produces:
  - `interface Combatant { types: TypeName[]; stats: StatBlock }`
  - `baseDamage(power: number, attack: number, defense: number): number`
  - `stab(moveType: TypeName, attackerTypes: TypeName[]): number`
  - `rollDamage(move: Move, attacker: Combatant, defender: Combatant, rng: Rng): { amount: number; effectiveness: number; crit: boolean }`
  - `expectedDamage(move: Move, attacker: Combatant, defender: Combatant): number`
  - `STRUGGLE: Move`, `autoMoveset(pool: Move[], types: TypeName[]): Move[]`, `chooseMove(moves: Move[], attacker: Combatant, defender: Combatant): Move`

- [ ] **Step 1: Write failing tests**

`lib/battle/damage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { baseDamage, rollDamage, expectedDamage, stab, type Combatant } from './damage';
import type { Move } from './types';

const flamethrower: Move = { name: 'flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' };
const stats = (o: Partial<Combatant['stats']>) => ({ hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100, ...o });
const attacker: Combatant = { types: ['fire'], stats: stats({ spa: 161 }) };
const grassDefender: Combatant = { types: ['grass'], stats: stats({ spd: 100 }) };
const ghost: Combatant = { types: ['ghost'], stats: stats({}) };
const seq = (...values: number[]) => { let i = 0; return () => values[i++]; };

describe('baseDamage', () => {
  it('matches the hand-computed value', () => {
    // floor(floor(22 * 90 * 161 / 100) / 50) + 2 = floor(3187 / 50) + 2 = 65
    expect(baseDamage(90, 161, 100)).toBe(65);
  });
});

describe('stab', () => {
  it('is 1.5 when move type matches, else 1', () => {
    expect(stab('fire', ['fire', 'flying'])).toBe(1.5);
    expect(stab('water', ['fire'])).toBe(1);
  });
});

describe('rollDamage', () => {
  it('applies STAB, type, and max random roll', () => {
    // rng: 0.5 → no crit, 0.999 → random 100
    expect(rollDamage(flamethrower, attacker, grassDefender, seq(0.5, 0.999)))
      .toEqual({ amount: 195, effectiveness: 2, crit: false });
  });
  it('applies the minimum random roll', () => {
    expect(rollDamage(flamethrower, attacker, grassDefender, seq(0.5, 0)).amount).toBe(165);
  });
  it('applies a critical hit', () => {
    expect(rollDamage(flamethrower, attacker, grassDefender, seq(0.01, 0.999)))
      .toEqual({ amount: 292, effectiveness: 2, crit: true });
  });
  it('deals 0 to an immune target', () => {
    const tackle: Move = { name: 'tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' };
    expect(rollDamage(tackle, attacker, ghost, seq(0.5, 0.5))).toEqual({ amount: 0, effectiveness: 0, crit: false });
  });
  it('deals at least 1 when not immune', () => {
    const weak: Move = { name: 'weak', type: 'fire', power: 1, accuracy: 100, damageClass: 'physical' };
    const tank: Combatant = { types: ['water', 'rock'], stats: stats({ def: 999 }) };
    const frail: Combatant = { types: ['normal'], stats: stats({ atk: 1 }) };
    expect(rollDamage(weak, frail, tank, seq(0.5, 0)).amount).toBe(1);
  });
});

describe('expectedDamage', () => {
  it('uses no randomness or crit and scales by accuracy', () => {
    expect(expectedDamage(flamethrower, attacker, grassDefender)).toBe(195);
    expect(expectedDamage({ ...flamethrower, accuracy: 50 }, attacker, grassDefender)).toBe(97.5);
  });
});
```

`lib/battle/moves.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { autoMoveset, chooseMove, STRUGGLE } from './moves';
import type { Combatant } from './damage';
import type { Move } from './types';

const m = (name: string, type: Move['type'], power: number, damageClass: Move['damageClass'] = 'special', accuracy: number | null = 100): Move =>
  ({ name, type, power, accuracy, damageClass });

describe('autoMoveset', () => {
  it('returns Struggle for an empty pool', () => {
    expect(autoMoveset([], ['normal'])).toEqual([STRUGGLE]);
  });
  it('picks the 4 strongest with at most 2 moves per type', () => {
    const pool = [
      m('blast-burn', 'fire', 150), m('fire-blast', 'fire', 110, 'special', 85), m('flamethrower', 'fire', 90),
      m('hydro-pump', 'water', 110, 'special', 80), m('hyper-beam', 'normal', 150, 'special', 90), m('ember', 'fire', 40),
    ];
    // scores: blast-burn 225, fire-blast 140.25, flamethrower 135, hyper-beam 135, hydro-pump 88, ember 60
    // flamethrower is skipped as the third fire move
    expect(autoMoveset(pool, ['fire']).map(x => x.name))
      .toEqual(['blast-burn', 'fire-blast', 'hyper-beam', 'hydro-pump']);
  });
  it('fills past the type cap when the pool is short on variety', () => {
    const pool = [m('a', 'fire', 100), m('b', 'fire', 90), m('c', 'fire', 80)];
    expect(autoMoveset(pool, ['fire']).map(x => x.name)).toEqual(['a', 'b', 'c']);
  });
  it('returns fewer than 4 when the pool is smaller', () => {
    expect(autoMoveset([m('a', 'fire', 100)], ['fire'])).toHaveLength(1);
  });
});

describe('chooseMove', () => {
  const s = { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const fireMon: Combatant = { types: ['fire'], stats: s };
  const moves = [m('flamethrower', 'fire', 90), m('earthquake', 'ground', 100, 'physical')];
  it('picks the super-effective STAB move vs grass', () => {
    expect(chooseMove(moves, fireMon, { types: ['grass'], stats: s }).name).toBe('flamethrower');
  });
  it('switches to the better move vs water', () => {
    expect(chooseMove(moves, fireMon, { types: ['water'], stats: s }).name).toBe('earthquake');
  });
  it('falls back to Struggle with no moves', () => {
    expect(chooseMove([], fireMon, { types: ['water'], stats: s })).toEqual(STRUGGLE);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./damage`, `./moves`.

- [ ] **Step 3: Implement**

`lib/battle/damage.ts`:

```ts
import { typeMultiplier } from '@/data/typeChart';
import { randInt, type Rng } from './rng';
import type { Move, StatBlock, TypeName } from './types';

export const LEVEL = 50;
export const CRIT_CHANCE = 1 / 24;
const CRIT_MULTIPLIER = 1.5;

export interface Combatant { types: TypeName[]; stats: StatBlock }

export function baseDamage(power: number, attack: number, defense: number): number {
  const levelFactor = Math.floor((2 * LEVEL) / 5 + 2);
  return Math.floor(Math.floor((levelFactor * power * attack) / defense) / 50) + 2;
}

export function stab(moveType: TypeName, attackerTypes: TypeName[]): number {
  return attackerTypes.includes(moveType) ? 1.5 : 1;
}

function attackDefense(move: Move, attacker: StatBlock, defender: StatBlock): [number, number] {
  return move.damageClass === 'physical' ? [attacker.atk, defender.def] : [attacker.spa, defender.spd];
}

export function rollDamage(move: Move, attacker: Combatant, defender: Combatant, rng: Rng) {
  const effectiveness = typeMultiplier(move.type, defender.types);
  const crit = rng() < CRIT_CHANCE;
  if (effectiveness === 0) return { amount: 0, effectiveness, crit: false };
  const [a, d] = attackDefense(move, attacker.stats, defender.stats);
  const base = baseDamage(move.power, a, d);
  const randomPct = randInt(rng, 85, 100);
  const amount = Math.floor(
    (base * stab(move.type, attacker.types) * effectiveness * (crit ? CRIT_MULTIPLIER : 1) * randomPct) / 100,
  );
  return { amount: Math.max(1, amount), effectiveness, crit };
}

export function expectedDamage(move: Move, attacker: Combatant, defender: Combatant): number {
  const effectiveness = typeMultiplier(move.type, defender.types);
  if (effectiveness === 0) return 0;
  const [a, d] = attackDefense(move, attacker.stats, defender.stats);
  const accuracy = (move.accuracy ?? 100) / 100;
  return baseDamage(move.power, a, d) * stab(move.type, attacker.types) * effectiveness * accuracy;
}
```

`lib/battle/moves.ts`:

```ts
import { expectedDamage, stab, type Combatant } from './damage';
import type { Move, TypeName } from './types';

export const STRUGGLE: Move = { name: 'struggle', type: 'normal', power: 50, accuracy: null, damageClass: 'physical' };

const MAX_PER_TYPE = 2;

function moveScore(move: Move, types: TypeName[]): number {
  return (move.power * (move.accuracy ?? 100)) / 100 * stab(move.type, types);
}

export function autoMoveset(pool: Move[], types: TypeName[]): Move[] {
  if (pool.length === 0) return [STRUGGLE];
  const ranked = [...pool].sort((a, b) => moveScore(b, types) - moveScore(a, types) || a.name.localeCompare(b.name));
  const picked: Move[] = [];
  const perType = new Map<TypeName, number>();
  for (const move of ranked) {
    if (picked.length === 4) break;
    const n = perType.get(move.type) ?? 0;
    if (n >= MAX_PER_TYPE) continue;
    picked.push(move);
    perType.set(move.type, n + 1);
  }
  for (const move of ranked) {
    if (picked.length === 4) break;
    if (!picked.includes(move)) picked.push(move);
  }
  return picked;
}

export function chooseMove(moves: Move[], attacker: Combatant, defender: Combatant): Move {
  if (moves.length === 0) return STRUGGLE;
  let best = moves[0];
  let bestValue = expectedDamage(best, attacker, defender);
  for (const move of moves.slice(1)) {
    const value = expectedDamage(move, attacker, defender);
    if (value > bestValue) { best = move; bestValue = value; }
  }
  return best;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/battle
git commit -m "feat(battle): add damage formula, auto moveset, and best-move choice"
```

---

### Task 4: Battle engine `simulate`

**Files:**
- Create: `lib/battle/engine.ts`
- Test: `lib/battle/engine.test.ts`

**Interfaces:**
- Consumes: `TeamMember`, `BattleEvent`, `Side` (Task 2), `statsAtLevel50`, `createRng`, `rollDamage`, `chooseMove`, `STRUGGLE`, `Combatant` (Task 3).
- Produces: `simulate(teamA: TeamMember[], teamB: TeamMember[], seed: number): BattleEvent[]`, `TURN_CAP = 500`. The last event is always `{ kind: 'end' }`.

- [ ] **Step 1: Write failing tests**

`lib/battle/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { simulate, TURN_CAP } from './engine';
import type { BattleEvent, Move, StatBlock, TeamMember, TypeName } from './types';

const move = (name: string, type: TypeName, power: number, accuracy: number | null = 100): Move =>
  ({ name, type, power, accuracy, damageClass: 'physical' });
const base = (o: Partial<StatBlock> = {}): StatBlock => ({ hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, ...o });
const member = (name: string, types: TypeName[], stats: StatBlock, moves: Move[]): TeamMember => ({
  pokemon: { id: 1, name, types, baseStats: stats, sprites: { front: null, back: null, artwork: null }, movePool: moves },
  moves,
});
const kinds = (events: BattleEvent[]) => events.map(e => e.kind);

const strongFast = member('titan', ['normal'], base({ atk: 255, spe: 200 }), [move('mega-punch', 'normal', 250)]);
const weakSlow = (n: string) => member(n, ['normal'], base({ hp: 20, def: 10, spe: 10 }), [move('tackle', 'normal', 10)]);

describe('simulate', () => {
  it('starts with both switch-ins and ends with an end event', () => {
    const events = simulate([strongFast], [weakSlow('w1')], 1);
    expect(events[0]).toMatchObject({ kind: 'switchIn', side: 'A', index: 0 });
    expect(events[1]).toMatchObject({ kind: 'switchIn', side: 'B', index: 0 });
    expect(events.at(-1)).toMatchObject({ kind: 'end', winner: 'A', reason: 'knockout' });
  });

  it('lets the faster Pokémon act first', () => {
    const events = simulate([weakSlow('w1')], [strongFast], 1);
    expect(events.find(e => e.kind === 'useMove')).toMatchObject({ side: 'B' });
  });

  it('is deterministic for a seed', () => {
    const a = [member('x', ['fire'], base(), [move('ember', 'fire', 40, 90)])];
    const b = [member('y', ['water'], base(), [move('bubble', 'water', 40, 90)])];
    expect(simulate(a, b, 99)).toEqual(simulate(a, b, 99));
  });

  it('switches in the next Pokémon after a faint, and it does not act that turn', () => {
    const events = simulate([strongFast], [weakSlow('w1'), weakSlow('w2')], 5);
    const k = kinds(events);
    const faintAt = k.indexOf('faint');
    expect(events[faintAt]).toMatchObject({ side: 'B', index: 0 });
    expect(events[faintAt + 1]).toMatchObject({ kind: 'switchIn', side: 'B', index: 1 });
    expect(events[faintAt + 2]).toMatchObject({ kind: 'useMove', side: 'A' });
  });

  it('emits a miss for a 0-accuracy move', () => {
    const a = [member('x', ['normal'], base({ spe: 200 }), [move('whiff', 'normal', 50, 0)])];
    const b = [member('y', ['normal'], base(), [move('whiff', 'normal', 50, 0)])];
    const events = simulate(a, b, 1);
    expect(events[2]).toMatchObject({ kind: 'useMove', side: 'A' });
    expect(events[3]).toMatchObject({ kind: 'miss', side: 'A' });
  });

  it('ends at the turn cap when nobody can deal damage', () => {
    const a = [member('norm', ['normal'], base(), [move('tackle', 'normal', 40)])];
    const b = [member('spook', ['ghost'], base(), [move('lick', 'ghost', 30)])];
    const events = simulate(a, b, 1);
    expect(events.at(-1)).toMatchObject({ kind: 'end', reason: 'turnCap', winner: 'A' });
    expect(events.filter(e => e.kind === 'useMove')).toHaveLength(TURN_CAP * 2);
  });

  it('handles uneven teams and reports damage per Pokémon', () => {
    const events = simulate([strongFast], [weakSlow('a'), weakSlow('b'), weakSlow('c')], 3);
    const end = events.at(-1);
    if (end?.kind !== 'end') throw new Error('no end');
    expect(end.winner).toBe('A');
    expect(end.damageDealt.A).toHaveLength(1);
    expect(end.damageDealt.B).toHaveLength(3);
    expect(end.damageDealt.A[0]).toBeGreaterThan(0);
  });

  it('never drops HP below 0 and damage amounts equal HP lost', () => {
    const events = simulate([strongFast], [weakSlow('w1')], 8);
    const dmg = events.find(e => e.kind === 'damage');
    if (dmg?.kind !== 'damage') throw new Error('no damage');
    expect(dmg.hpAfter).toBe(0);
  });

  it('throws when a team is empty', () => {
    expect(() => simulate([], [strongFast], 1)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/battle/engine.test.ts`
Expected: FAIL — cannot resolve `./engine`.

- [ ] **Step 3: Implement `lib/battle/engine.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/battle
git commit -m "feat(battle): add deterministic 6v6 simulate engine"
```

---

### Task 5: Battle view reducer and battle messages

**Files:**
- Create: `lib/battle/view.ts`, `lib/pokeapi/names.ts` (only `displayName` for now; Task 7 adds the rest)
- Test: `lib/battle/view.test.ts`

**Interfaces:**
- Consumes: `BattleEvent`, `Side`, `TeamMember`, `statsAtLevel50`.
- Produces:
  - `displayName(slug: string): string` — `"mr-mime"` → `"Mr Mime"`
  - `interface BattleView { active: Record<Side, number | null>; hp: Record<Side, number[]>; maxHp: Record<Side, number[]>; fainted: Record<Side, boolean[]>; message: string; messageId: number; winner: Side | null }`
  - `type TeamNames = Record<Side, string[]>`
  - `teamNames(teamA: TeamMember[], teamB: TeamMember[]): TeamNames` (uppercase display names)
  - `initView(teamA: TeamMember[], teamB: TeamMember[]): BattleView`
  - `applyEvent(view: BattleView, event: BattleEvent, names: TeamNames): BattleView` (pure)
  - `moveLabel(name: string): string` — `"fire-blast"` → `"FIRE BLAST"`

- [ ] **Step 1: Write failing tests**

`lib/battle/view.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyEvent, initView, moveLabel, teamNames, type BattleView } from './view';
import type { BattleEvent, TeamMember } from './types';

const mon = (name: string): TeamMember => ({
  pokemon: { id: 1, name, types: ['normal'], baseStats: { hp: 78, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
    sprites: { front: null, back: null, artwork: null }, movePool: [] },
  moves: [],
});
const A = [mon('charizard'), mon('mr-mime')];
const B = [mon('azumarill')];
const names = teamNames(A, B);
const run = (events: BattleEvent[], v: BattleView = initView(A, B)) => events.reduce((s, e) => applyEvent(s, e, names), v);
const flamethrower = { name: 'flamethrower', type: 'fire' as const, power: 90, accuracy: 100, damageClass: 'special' as const };

describe('battle view', () => {
  it('starts at full HP with nobody active', () => {
    const v = initView(A, B);
    expect(v.hp.A).toEqual([153, 153]);
    expect(v.active).toEqual({ A: null, B: null });
    expect(v.message).toBe('');
  });

  it('uppercases names and formats move labels', () => {
    expect(names.A).toEqual(['CHARIZARD', 'MR MIME']);
    expect(moveLabel('fire-blast')).toBe('FIRE BLAST');
  });

  it('writes switch-in messages for both sides', () => {
    const v = run([{ kind: 'switchIn', side: 'A', index: 0, hp: 153, maxHp: 153 }]);
    expect(v.active.A).toBe(0);
    expect(v.message).toBe('Go! CHARIZARD!');
    const w = applyEvent(v, { kind: 'switchIn', side: 'B', index: 0, hp: 153, maxHp: 153 }, names);
    expect(w.message).toBe('Enemy sent out AZUMARILL!');
  });

  it('prefixes enemy moves with "Enemy"', () => {
    const v = run([{ kind: 'useMove', side: 'B', index: 0, move: flamethrower }]);
    expect(v.message).toBe('Enemy AZUMARILL used FLAMETHROWER!');
  });

  it('updates HP and adds effectiveness text', () => {
    const v = run([{ kind: 'damage', side: 'B', index: 0, amount: 50, hpAfter: 103, effectiveness: 2, crit: true }]);
    expect(v.hp.B[0]).toBe(103);
    expect(v.message).toBe("A critical hit! It's super effective!");
  });

  it('keeps the previous message (and id) for plain neutral damage', () => {
    const before = run([{ kind: 'useMove', side: 'A', index: 0, move: flamethrower }]);
    const after = applyEvent(before, { kind: 'damage', side: 'B', index: 0, amount: 10, hpAfter: 143, effectiveness: 1, crit: false }, names);
    expect(after.message).toBe('CHARIZARD used FLAMETHROWER!');
    expect(after.messageId).toBe(before.messageId);
  });

  it('describes immunity, misses, faints, and the end', () => {
    expect(run([{ kind: 'damage', side: 'B', index: 0, amount: 0, hpAfter: 153, effectiveness: 0, crit: false }]).message)
      .toBe("It doesn't affect Enemy AZUMARILL…");
    expect(run([{ kind: 'miss', side: 'A', index: 1 }]).message).toBe("MR MIME's attack missed!");
    const fainted = run([{ kind: 'faint', side: 'B', index: 0 }]);
    expect(fainted.fainted.B[0]).toBe(true);
    expect(fainted.message).toBe('Enemy AZUMARILL fainted!');
    const end = run([{ kind: 'end', winner: 'A', reason: 'knockout', damageDealt: { A: [0, 0], B: [0] } }]);
    expect(end.winner).toBe('A');
    expect(end.message).toBe('You won the battle!');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/battle/view.test.ts`
Expected: FAIL — cannot resolve `./view`.

- [ ] **Step 3: Implement**

`lib/pokeapi/names.ts`:

```ts
export function displayName(slug: string): string {
  return slug.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}
```

`lib/battle/view.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/battle lib/pokeapi
git commit -m "feat(battle): add battle view reducer and Gen 2-style messages"
```

---

### Task 6: TCG data layer — rarity tiers, price selection, ranking, client, showcase

**Files:**
- Create: `data/rarity.ts`, `lib/tcg/types.ts`, `lib/tcg/normalize.ts`, `lib/tcg/rank.ts`, `lib/tcg/client.ts`, `data/showcase.ts`, `scripts/verify-showcase.ts`
- Test: `data/rarity.test.ts`, `lib/tcg/normalize.test.ts`, `lib/tcg/rank.test.ts`

**Interfaces:**
- Produces:
  - `type Tier = 'grail' | 'ultra' | 'holo' | 'rare' | 'uncommon' | 'common'`, `TIER_ORDER: Tier[]`, `TIER_META: Record<Tier, { label: string; blurb: string }>`, `rarityToTier(rarity: string | null | undefined): Tier`
  - `type Era = 'vintage' | 'modern'`
  - `interface Price { market: number; low: number | null; high: number | null; source: 'TCGplayer' | 'Cardmarket'; currency: 'USD' | 'EUR'; variant: string | null; updatedAt: string }`
  - `interface Card { id: string; name: string; setName: string; setSeries: string; number: string; rarity: string | null; tier: Tier; era: Era; images: { small: string; large: string }; price: Price | null; releaseDate: string }`
  - `selectPrice(raw: RawCard): Price | null`, `normalizeCard(raw: RawCard): Card`, `variantLabel(key: string | null): string`
  - `groupByTier(cards: Card[]): { tier: Tier; cards: Card[] }[]` (only non-empty tiers, in `TIER_ORDER`)
  - `getCard(id: string): Promise<Card | null>`, `getCards(ids: string[]): Promise<Card[]>`
  - `SHOWCASE: { id: string; note?: string }[]`, `FEATURED_CARD_ID = 'base1-4'`
  - `formatPrice(price: Price): string`

- [ ] **Step 1: Write failing tests**

`data/rarity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rarityToTier, TIER_ORDER } from './rarity';

describe('rarityToTier', () => {
  it.each([
    ['Special Illustration Rare', 'grail'], ['Hyper Rare', 'grail'], ['Rare Secret', 'grail'],
    ['Rare Rainbow', 'grail'], ['Rare Holo Star', 'grail'], ['Rare Shining', 'grail'],
    ['Illustration Rare', 'ultra'], ['Ultra Rare', 'ultra'], ['Double Rare', 'ultra'],
    ['Rare Holo VMAX', 'ultra'], ['Rare Holo VSTAR', 'ultra'], ['Rare Holo GX', 'ultra'], ['Rare Ultra', 'ultra'],
    ['Rare Holo', 'holo'], ['Rare', 'rare'], ['Uncommon', 'uncommon'], ['Common', 'common'],
  ])('%s → %s', (rarity, tier) => expect(rarityToTier(rarity)).toBe(tier));

  it('falls back by keyword for unknown strings', () => {
    expect(rarityToTier('Shiny Ultra Rare')).toBe('ultra');
    expect(rarityToTier('Trainer Gallery Rare Holo')).toBe('holo');
    expect(rarityToTier('Radiant Rare')).toBe('ultra');
  });

  it('falls back to rare for unknown or missing rarity', () => {
    expect(rarityToTier('Promo')).toBe('rare');
    expect(rarityToTier('Classic Collection')).toBe('rare');
    expect(rarityToTier(null)).toBe('rare');
    expect(rarityToTier(undefined)).toBe('rare');
  });

  it('orders tiers rarest first', () => {
    expect(TIER_ORDER).toEqual(['grail', 'ultra', 'holo', 'rare', 'uncommon', 'common']);
  });
});
```

`lib/tcg/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeCard, selectPrice, variantLabel } from './normalize';
import type { RawCard } from './types';

const raw: RawCard = {
  id: 'base1-4', name: 'Charizard', number: '4', rarity: 'Rare Holo',
  set: { name: 'Base', series: 'Base', releaseDate: '1999/01/09' },
  images: { small: 'https://images.pokemontcg.io/base1/4.png', large: 'https://images.pokemontcg.io/base1/4_hires.png' },
  tcgplayer: { updatedAt: '2026/10/09', prices: { '1stEditionHolofoil': { low: 3000, high: 20000, market: 9000 }, unlimitedHolofoil: { low: 300, high: 2000, market: 420 } } },
  cardmarket: { updatedAt: '2026/10/09', prices: { averageSellPrice: 380 } },
};

describe('selectPrice', () => {
  it('prefers holofoil, then 1st edition holofoil', () => {
    expect(selectPrice(raw)).toEqual({ market: 9000, low: 3000, high: 20000, source: 'TCGplayer', currency: 'USD', variant: '1stEditionHolofoil', updatedAt: '2026/10/09' });
    const withHolo: RawCard = { ...raw, tcgplayer: { updatedAt: 'x', prices: { normal: { market: 1 }, holofoil: { market: 50, low: 40, high: 60 } } } };
    expect(selectPrice(withHolo)?.variant).toBe('holofoil');
  });
  it('skips variants without a market price', () => {
    const r: RawCard = { ...raw, tcgplayer: { updatedAt: 'x', prices: { holofoil: { market: null, low: 1 }, normal: { market: 2 } } } };
    expect(selectPrice(r)?.variant).toBe('normal');
  });
  it('falls back to Cardmarket in EUR', () => {
    const r: RawCard = { ...raw, tcgplayer: undefined };
    expect(selectPrice(r)).toEqual({ market: 380, low: null, high: null, source: 'Cardmarket', currency: 'EUR', variant: null, updatedAt: '2026/10/09' });
  });
  it('returns null with no price data at all', () => {
    expect(selectPrice({ ...raw, tcgplayer: undefined, cardmarket: undefined })).toBeNull();
  });
});

describe('normalizeCard', () => {
  it('maps fields, tier, and era', () => {
    const c = normalizeCard(raw);
    expect(c).toMatchObject({ id: 'base1-4', name: 'Charizard', setName: 'Base', number: '4', tier: 'holo', era: 'vintage' });
    expect(normalizeCard({ ...raw, set: { ...raw.set, releaseDate: '2023/09/22' } }).era).toBe('modern');
  });
});

describe('variantLabel', () => {
  it('humanizes variant keys', () => {
    expect(variantLabel('1stEditionHolofoil')).toBe('1st Edition Holofoil');
    expect(variantLabel('reverseHolofoil')).toBe('Reverse Holofoil');
    expect(variantLabel(null)).toBe('Average sell price');
  });
});
```

`lib/tcg/rank.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { groupByTier } from './rank';
import type { Card, Price } from './types';

const price = (market: number): Price => ({ market, low: null, high: null, source: 'TCGplayer', currency: 'USD', variant: 'holofoil', updatedAt: 'x' });
const card = (id: string, tier: Card['tier'], p: Price | null): Card => ({
  id, name: id, setName: 's', setSeries: 's', number: '1', rarity: null, tier, era: 'modern',
  images: { small: '', large: '' }, price: p, releaseDate: '2024/01/01',
});

describe('groupByTier', () => {
  it('orders tiers rarest first, skips empty tiers, sorts by price desc with unpriced last', () => {
    const groups = groupByTier([
      card('c1', 'common', price(1)), card('g-cheap', 'grail', price(100)),
      card('g-none', 'grail', null), card('g-rich', 'grail', price(900)),
    ]);
    expect(groups.map(g => g.tier)).toEqual(['grail', 'common']);
    expect(groups[0].cards.map(c => c.id)).toEqual(['g-rich', 'g-cheap', 'g-none']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./rarity`, `./normalize`, `./rank`.

- [ ] **Step 3: Implement `data/rarity.ts`**

```ts
export type Tier = 'grail' | 'ultra' | 'holo' | 'rare' | 'uncommon' | 'common';

export const TIER_ORDER: Tier[] = ['grail', 'ultra', 'holo', 'rare', 'uncommon', 'common'];

export const TIER_META: Record<Tier, { label: string; blurb: string }> = {
  grail: { label: 'Grail', blurb: 'Secret, hyper, gold star and special illustration rares — the cards collectors chase for years.' },
  ultra: { label: 'Ultra', blurb: 'Illustration rares, full arts and rule-box Pokémon (V, VMAX, ex, GX).' },
  holo: { label: 'Holo', blurb: 'Classic holofoil rares — the shine that started it all.' },
  rare: { label: 'Rare', blurb: 'Non-holo rares, marked with a single black star.' },
  uncommon: { label: 'Uncommon', blurb: 'Marked with a diamond. Plentiful, but key to completing a set.' },
  common: { label: 'Common', blurb: 'Marked with a circle. Every pack has them — but mint vintage commons still surprise.' },
};

const EXACT: Record<string, Tier> = {
  'special illustration rare': 'grail', 'hyper rare': 'grail', 'rare secret': 'grail', 'rare rainbow': 'grail',
  'rare holo star': 'grail', 'rare shining': 'grail', 'rare shiny gx': 'ultra',
  'illustration rare': 'ultra', 'ultra rare': 'ultra', 'double rare': 'ultra', 'rare ultra': 'ultra',
  'rare holo v': 'ultra', 'rare holo vmax': 'ultra', 'rare holo vstar': 'ultra', 'rare holo ex': 'ultra',
  'rare holo gx': 'ultra', 'rare holo lv.x': 'ultra', 'rare prism star': 'ultra',
  'rare holo': 'holo', 'rare': 'rare', 'uncommon': 'uncommon', 'common': 'common',
};

const KEYWORDS: [RegExp, Tier][] = [
  [/secret|rainbow|hyper|special illustration|gold star|shining/, 'grail'],
  [/illustration|ultra|vmax|vstar|\bv\b|\bex\b|\bgx\b|double|radiant|amazing|legend|lv\.x|prime|break|ace spec|shiny/, 'ultra'],
  [/holo/, 'holo'],
];

export function rarityToTier(rarity: string | null | undefined): Tier {
  if (!rarity) return 'rare';
  const key = rarity.trim().toLowerCase();
  if (EXACT[key]) return EXACT[key];
  for (const [re, tier] of KEYWORDS) if (re.test(key)) return tier;
  return 'rare';
}
```

- [ ] **Step 4: Implement `lib/tcg/types.ts`**

```ts
import type { Tier } from '@/data/rarity';

export type Era = 'vintage' | 'modern';

export interface Price {
  market: number;
  low: number | null;
  high: number | null;
  source: 'TCGplayer' | 'Cardmarket';
  currency: 'USD' | 'EUR';
  variant: string | null;
  updatedAt: string;
}

export interface Card {
  id: string;
  name: string;
  setName: string;
  setSeries: string;
  number: string;
  rarity: string | null;
  tier: Tier;
  era: Era;
  images: { small: string; large: string };
  price: Price | null;
  releaseDate: string;
}

interface RawVariantPrice { low?: number | null; mid?: number | null; high?: number | null; market?: number | null }

export interface RawCard {
  id: string;
  name: string;
  number: string;
  rarity?: string | null;
  set: { name: string; series: string; releaseDate: string };
  images: { small: string; large: string };
  tcgplayer?: { updatedAt: string; prices?: Record<string, RawVariantPrice> };
  cardmarket?: { updatedAt: string; prices?: { averageSellPrice?: number | null; trendPrice?: number | null } };
}
```

- [ ] **Step 5: Implement `lib/tcg/normalize.ts`**

```ts
import { rarityToTier } from '@/data/rarity';
import type { Card, Era, Price, RawCard } from './types';

const VARIANT_ORDER = ['holofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'reverseHolofoil', 'normal', '1stEditionNormal', 'unlimitedNormal'];

export function selectPrice(raw: RawCard): Price | null {
  const prices = raw.tcgplayer?.prices;
  if (prices) {
    const keys = [...VARIANT_ORDER, ...Object.keys(prices).filter(k => !VARIANT_ORDER.includes(k))];
    for (const key of keys) {
      const p = prices[key];
      if (p && typeof p.market === 'number' && p.market > 0) {
        return { market: p.market, low: p.low ?? null, high: p.high ?? null, source: 'TCGplayer', currency: 'USD', variant: key, updatedAt: raw.tcgplayer!.updatedAt };
      }
    }
  }
  const cm = raw.cardmarket?.prices;
  const avg = cm?.averageSellPrice ?? cm?.trendPrice;
  if (typeof avg === 'number' && avg > 0) {
    return { market: avg, low: null, high: null, source: 'Cardmarket', currency: 'EUR', variant: null, updatedAt: raw.cardmarket!.updatedAt };
  }
  return null;
}

export function eraOf(releaseDate: string): Era {
  return Number(releaseDate.slice(0, 4)) < 2003 ? 'vintage' : 'modern';
}

export function normalizeCard(raw: RawCard): Card {
  return {
    id: raw.id,
    name: raw.name,
    setName: raw.set.name,
    setSeries: raw.set.series,
    number: raw.number,
    rarity: raw.rarity ?? null,
    tier: rarityToTier(raw.rarity),
    era: eraOf(raw.set.releaseDate),
    images: raw.images,
    price: selectPrice(raw),
    releaseDate: raw.set.releaseDate,
  };
}

export function variantLabel(key: string | null): string {
  if (!key) return 'Average sell price';
  return key
    .replace(/^1st/, '1st ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPrice(price: Price): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, maximumFractionDigits: price.market >= 100 ? 0 : 2 }).format(price.market);
}
```

- [ ] **Step 6: Implement `lib/tcg/rank.ts`**

```ts
import { TIER_ORDER, type Tier } from '@/data/rarity';
import type { Card } from './types';

export function groupByTier(cards: Card[]): { tier: Tier; cards: Card[] }[] {
  return TIER_ORDER.map(tier => ({
    tier,
    cards: cards
      .filter(c => c.tier === tier)
      .sort((a, b) => (b.price?.market ?? -1) - (a.price?.market ?? -1)),
  })).filter(g => g.cards.length > 0);
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 8: Implement `lib/tcg/client.ts`**

```ts
import { normalizeCard } from './normalize';
import type { Card, RawCard } from './types';

const API = 'https://api.pokemontcg.io/v2';
const REVALIDATE = 86400;

function headers(): HeadersInit {
  const key = process.env.POKEMONTCG_API_KEY;
  return key ? { 'X-Api-Key': key } : {};
}

export async function getCard(id: string): Promise<Card | null> {
  const res = await fetch(`${API}/cards/${encodeURIComponent(id)}`, { headers: headers(), next: { revalidate: REVALIDATE } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Pokémon TCG API returned ${res.status} for ${id}`);
  const json = (await res.json()) as { data: RawCard };
  return normalizeCard(json.data);
}

export async function getCards(ids: string[]): Promise<Card[]> {
  if (ids.length === 0) return [];
  const q = ids.map(id => `id:${id}`).join(' OR ');
  const res = await fetch(`${API}/cards?q=${encodeURIComponent(q)}&pageSize=250`, { headers: headers(), next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`Pokémon TCG API returned ${res.status} for card list`);
  const json = (await res.json()) as { data: RawCard[] };
  return json.data.map(normalizeCard);
}
```

- [ ] **Step 9: Create `data/showcase.ts`**

```ts
export const FEATURED_CARD_ID = 'base1-4';

export const SHOWCASE: { id: string; note?: string }[] = [
  // Grail candidates
  { id: 'sv3pt5-199', note: 'The 151 Charizard ex special illustration rare — the modern era’s defining chase card.' },
  { id: 'sv3pt5-205', note: 'Gold hyper rare Mew ex — a textured gold foil finish limited to one per set.' },
  { id: 'sv4pt5-234' },
  { id: 'sv8-238', note: 'Surging Sparks’ Pikachu ex special illustration rare.' },
  { id: 'swsh7-215', note: '“Moonbreon” — the Umbreon VMAX alternate art, the most sought-after card of the Sword & Shield era.' },
  { id: 'swsh11-186' },
  { id: 'swsh12-186' },
  { id: 'ex8-107', note: 'Gold Star Rayquaza — Gold Stars were pulled roughly once per several booster boxes.' },
  { id: 'pop5-17', note: 'Gold Star Umbreon from POP Series 5, only available in small promo packs.' },
  { id: 'neo4-107', note: 'Shining Charizard from Neo Destiny — the first shiny Charizard card.' },
  // Ultra
  { id: 'sv3pt5-6' },
  { id: 'swsh7-95' },
  // Holo
  { id: 'base1-4', note: 'Base Set Charizard. A 1st Edition PSA 10 is one of the most valuable trading cards ever sold.' },
  { id: 'base1-2' },
  { id: 'base1-15' },
  { id: 'base1-10' },
  { id: 'neo1-9' },
  { id: 'gym2-2' },
  // Rare
  { id: 'base1-20' },
  { id: 'base1-17' },
  // Uncommon
  { id: 'base1-24' },
  { id: 'base1-30' },
  { id: 'base1-42' },
  { id: 'sv3pt5-2' },
  { id: 'sv3pt5-5' },
  // Common
  { id: 'base1-58', note: 'Base Set “Red Cheeks” Pikachu — a common worth far more than most rares when in mint condition.' },
  { id: 'base1-46' },
  { id: 'base1-44' },
  { id: 'base1-63' },
  { id: 'sv3pt5-25' },
  { id: 'sv3pt5-4' },
  { id: 'sv3pt5-1' },
];
```

- [ ] **Step 10: Create `scripts/verify-showcase.ts`**

```ts
import { SHOWCASE } from '../data/showcase';
import { getCards } from '../lib/tcg/client';

async function main() {
  const cards = await getCards(SHOWCASE.map(s => s.id));
  const found = new Map(cards.map(c => [c.id, c]));
  let problems = 0;
  for (const { id } of SHOWCASE) {
    const c = found.get(id);
    if (!c) { console.log(`MISSING   ${id}`); problems++; continue; }
    if (!c.price) { console.log(`NO PRICE  ${id} (${c.name})`); problems++; continue; }
    console.log(`ok        ${id.padEnd(14)} ${c.tier.padEnd(9)} ${c.name} — ${c.price.market} ${c.price.currency}`);
  }
  console.log(problems ? `\n${problems} problem(s): remove or replace these IDs in data/showcase.ts.` : '\nAll showcase cards verified.');
  process.exitCode = problems ? 1 : 0;
}

main();
```

- [ ] **Step 11: Run the verify script and prune the showcase**

Run: `npm run verify:showcase`
Expected: one line per ID. For every `MISSING` or `NO PRICE` line, remove that entry from `data/showcase.ts` (or replace it with a working ID found at https://pokemontcg.io). Re-run until it prints `All showcase cards verified.` Keep at least two cards in each tier you can fill; the grail tier must have at least 3.

- [ ] **Step 12: Commit**

```bash
git add data lib/tcg scripts
git commit -m "feat(cards): add TCG client, rarity tiers, price selection, and curated showcase"
```

---

### Task 7: PokéAPI data layer and `/api/pokemon/[name]` route

**Files:**
- Modify: `lib/pokeapi/names.ts`
- Create: `lib/pokeapi/normalize.ts`, `lib/pokeapi/client.ts`, `app/api/pokemon/[name]/route.ts`
- Test: `lib/pokeapi/names.test.ts`, `lib/pokeapi/normalize.test.ts`

**Interfaces:**
- Consumes: `BattlePokemon`, `Move`, `TYPE_NAMES`, `TypeName`.
- Produces:
  - `toSlug(input: string): string`, `displayName(slug: string): string`, `idFromUrl(url: string): number`
  - `normalizeMove(raw: RawMove): Move | null`, `normalizePokemon(raw: RawPokemon, moves: RawMove[]): BattlePokemon`
  - `fetchPokemon(slug: string): Promise<BattlePokemon | null>`, `getPokemonNames(): Promise<string[]>`
  - `GET /api/pokemon/:name` → `200 BattlePokemon` | `404 { error: 'not_found' }` | `502 { error: 'upstream' }`

- [ ] **Step 1: Write failing tests**

`lib/pokeapi/names.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { displayName, idFromUrl, toSlug } from './names';

describe('toSlug', () => {
  it.each([
    [' Pikachu ', 'pikachu'], ['Mr. Mime', 'mr-mime'], ["Farfetch'd", 'farfetchd'],
    ['Nidoran♀', 'nidoran-f'], ['Nidoran♂', 'nidoran-m'], ['Tapu  Koko', 'tapu-koko'], ['ho_oh', 'ho-oh'],
  ])('%s → %s', (input, slug) => expect(toSlug(input)).toBe(slug));
});

describe('displayName', () => {
  it('title-cases slugs', () => expect(displayName('mr-mime')).toBe('Mr Mime'));
});

describe('idFromUrl', () => {
  it('extracts the trailing id', () => expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25));
});
```

`lib/pokeapi/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeMove, normalizePokemon } from './normalize';
import type { RawMove, RawPokemon } from './normalize';

const rawMove = (name: string, type: string, power: number | null, cls: string, accuracy: number | null = 100): RawMove =>
  ({ name, power, accuracy, type: { name: type }, damage_class: { name: cls } });

const raw: RawPokemon = {
  id: 6, name: 'charizard',
  types: [{ slot: 2, type: { name: 'flying' } }, { slot: 1, type: { name: 'fire' } }],
  stats: [
    { base_stat: 78, stat: { name: 'hp' } }, { base_stat: 84, stat: { name: 'attack' } },
    { base_stat: 78, stat: { name: 'defense' } }, { base_stat: 109, stat: { name: 'special-attack' } },
    { base_stat: 85, stat: { name: 'special-defense' } }, { base_stat: 100, stat: { name: 'speed' } },
  ],
  moves: [],
  sprites: {
    front_default: 'front.png', back_default: 'back.png',
    other: { showdown: { front_default: 'sd-front.gif', back_default: null }, 'official-artwork': { front_default: 'art.png' } },
  },
};

describe('normalizeMove', () => {
  it('keeps damaging moves', () => {
    expect(normalizeMove(rawMove('flamethrower', 'fire', 90, 'special'))).toEqual({ name: 'flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' });
  });
  it('drops status moves, powerless moves, and unknown types', () => {
    expect(normalizeMove(rawMove('swords-dance', 'normal', null, 'status'))).toBeNull();
    expect(normalizeMove(rawMove('counter', 'fighting', null, 'physical'))).toBeNull();
    expect(normalizeMove(rawMove('tera-blast', 'stellar', 80, 'special'))).toBeNull();
  });
});

describe('normalizePokemon', () => {
  it('maps stats, slot-ordered types, sprites with fallbacks, and a deduped move pool', () => {
    const p = normalizePokemon(raw, [rawMove('flamethrower', 'fire', 90, 'special'), rawMove('flamethrower', 'fire', 90, 'special'), rawMove('roost', 'flying', null, 'status')]);
    expect(p.types).toEqual(['fire', 'flying']);
    expect(p.baseStats).toEqual({ hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 });
    expect(p.sprites).toEqual({ front: 'sd-front.gif', back: 'back.png', artwork: 'art.png' });
    expect(p.movePool.map(m => m.name)).toEqual(['flamethrower']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/pokeapi`
Expected: FAIL — `toSlug`/`idFromUrl` not exported; `./normalize` missing.

- [ ] **Step 3: Implement `lib/pokeapi/names.ts` (full file)**

```ts
export function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[.'’]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function displayName(slug: string): string {
  return slug.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

export function idFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
}
```

- [ ] **Step 4: Implement `lib/pokeapi/normalize.ts`**

```ts
import { TYPE_NAMES, type BattlePokemon, type Move, type StatBlock, type TypeName } from '@/lib/battle/types';

export interface RawMove {
  name: string;
  power: number | null;
  accuracy: number | null;
  type: { name: string };
  damage_class: { name: string };
}

export interface RawPokemon {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  moves: { move: { name: string; url: string } }[];
  sprites: {
    front_default: string | null;
    back_default: string | null;
    other?: {
      showdown?: { front_default: string | null; back_default: string | null };
      'official-artwork'?: { front_default: string | null };
    };
  };
}

const isType = (t: string): t is TypeName => (TYPE_NAMES as readonly string[]).includes(t);

const STAT_KEYS: Record<string, keyof StatBlock> = {
  hp: 'hp', attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd', speed: 'spe',
};

export function normalizeMove(raw: RawMove): Move | null {
  const cls = raw.damage_class.name;
  if (cls !== 'physical' && cls !== 'special') return null;
  if (!raw.power || raw.power <= 0) return null;
  if (!isType(raw.type.name)) return null;
  return { name: raw.name, type: raw.type.name, power: raw.power, accuracy: raw.accuracy, damageClass: cls };
}

export function normalizePokemon(raw: RawPokemon, moves: RawMove[]): BattlePokemon {
  const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const s of raw.stats) {
    const key = STAT_KEYS[s.stat.name];
    if (key) baseStats[key] = s.base_stat;
  }
  const types = [...raw.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name).filter(isType);
  const seen = new Set<string>();
  const movePool: Move[] = [];
  for (const m of moves) {
    const move = normalizeMove(m);
    if (move && !seen.has(move.name)) { seen.add(move.name); movePool.push(move); }
  }
  const sd = raw.sprites.other?.showdown;
  const art = raw.sprites.other?.['official-artwork']?.front_default ?? null;
  return {
    id: raw.id,
    name: raw.name,
    types,
    baseStats,
    sprites: {
      front: sd?.front_default ?? raw.sprites.front_default ?? art,
      back: sd?.back_default ?? raw.sprites.back_default ?? art,
      artwork: art,
    },
    movePool,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Implement `lib/pokeapi/client.ts`**

```ts
import type { BattlePokemon } from '@/lib/battle/types';
import { idFromUrl } from './names';
import { normalizePokemon, type RawMove, type RawPokemon } from './normalize';

const API = 'https://pokeapi.co/api/v2';
const WEEK = 604800;
const MAX_NATIONAL_DEX = 1025;
const CONCURRENCY = 16;

// In-process memo on top of Next's fetch cache, so a warm server never refetches a move.
const moveMemo = new Map<string, Promise<RawMove | null>>();

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { next: { revalidate: WEEK } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokéAPI returned ${res.status} for ${url}`);
  return (await res.json()) as T;
}

function getMove(url: string): Promise<RawMove | null> {
  let p = moveMemo.get(url);
  if (!p) {
    p = getJson<RawMove>(url).catch(err => { moveMemo.delete(url); throw err; });
    moveMemo.set(url, p);
  }
  return p;
}

export async function fetchPokemon(slug: string): Promise<BattlePokemon | null> {
  const raw = await getJson<RawPokemon>(`${API}/pokemon/${encodeURIComponent(slug)}`);
  if (!raw) return null;
  const urls = raw.moves.map(m => m.move.url);
  const moves: RawMove[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = await Promise.all(urls.slice(i, i + CONCURRENCY).map(getMove));
    for (const m of batch) if (m) moves.push(m);
  }
  return normalizePokemon(raw, moves);
}

export async function getPokemonNames(): Promise<string[]> {
  const json = await getJson<{ results: { name: string; url: string }[] }>(`${API}/pokemon?limit=2000`);
  return (json?.results ?? []).filter(r => idFromUrl(r.url) <= MAX_NATIONAL_DEX).map(r => r.name);
}
```

- [ ] **Step 7: Implement `app/api/pokemon/[name]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { fetchPokemon } from '@/lib/pokeapi/client';
import { toSlug } from '@/lib/pokeapi/names';

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    const pokemon = await fetchPokemon(toSlug(name));
    if (!pokemon) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(pokemon, {
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
```

- [ ] **Step 8: Manually verify the route**

Run `npm run dev`, then in another shell:

```bash
curl -s http://localhost:3000/api/pokemon/Charizard | head -c 400
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/pokemon/not-a-pokemon
```

Expected: JSON starting `{"id":6,"name":"charizard","types":["fire","flying"]...`, then `404`. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add lib/pokeapi app/api
git commit -m "feat(pokeapi): add PokéAPI client, normalizers, and cached Pokémon route"
```

---

### Task 8: Showdown state — teams reducer, matchup coverage, member loader

**Files:**
- Create: `lib/showdown/teams.ts`, `lib/showdown/matchup.ts`, `lib/showdown/loadMember.ts`
- Test: `lib/showdown/teams.test.ts`, `lib/showdown/matchup.test.ts`

**Interfaces:**
- Consumes: `TeamMember`, `Move`, `Side`, `BattlePokemon`, `autoMoveset`, `typeMultiplier`.
- Produces:
  - `MAX_TEAM = 6`, `type Teams = Record<Side, TeamMember[]>`, `EMPTY_TEAMS: Teams`
  - `type TeamsAction = { type: 'add'; side: Side; member: TeamMember } | { type: 'remove'; side: Side; index: number } | { type: 'setMove'; side: Side; index: number; slot: number; move: Move } | { type: 'fillRandom'; side: Side; members: TeamMember[] }`
  - `teamsReducer(state: Teams, action: TeamsAction): Teams`
  - `randomFillCount(team: TeamMember[]): number` — 6 if the team is full, otherwise the number of empty slots
  - `coverage(attackers: TeamMember[], defenders: TeamMember[]): number` — how many defenders at least one attacker hits super-effectively
  - `loadMember(name: string): Promise<TeamMember>` (client; throws `Error('not_found' | 'upstream')`)

- [ ] **Step 1: Write failing tests**

`lib/showdown/teams.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { EMPTY_TEAMS, randomFillCount, teamsReducer } from './teams';
import type { Move, TeamMember } from '@/lib/battle/types';

const mv = (name: string): Move => ({ name, type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' });
const mon = (name: string): TeamMember => ({
  pokemon: { id: 1, name, types: ['normal'], baseStats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
    sprites: { front: null, back: null, artwork: null }, movePool: [mv('a'), mv('b')] },
  moves: [mv('a')],
});
const six = Array.from({ length: 6 }, (_, i) => mon(`m${i}`));

describe('teamsReducer', () => {
  it('adds up to 6 and ignores extras', () => {
    let s = EMPTY_TEAMS;
    for (let i = 0; i < 7; i++) s = teamsReducer(s, { type: 'add', side: 'A', member: mon(`p${i}`) });
    expect(s.A).toHaveLength(6);
    expect(s.B).toHaveLength(0);
  });
  it('removes by index', () => {
    const s = teamsReducer({ A: [mon('x'), mon('y')], B: [] }, { type: 'remove', side: 'A', index: 0 });
    expect(s.A.map(m => m.pokemon.name)).toEqual(['y']);
  });
  it('replaces one move slot', () => {
    const s = teamsReducer({ A: [mon('x')], B: [] }, { type: 'setMove', side: 'A', index: 0, slot: 0, move: mv('b') });
    expect(s.A[0].moves[0].name).toBe('b');
  });
  it('fillRandom appends to empty slots, or replaces a full team', () => {
    const partial = teamsReducer({ A: [], B: [mon('keep')] }, { type: 'fillRandom', side: 'B', members: [mon('r1'), mon('r2')] });
    expect(partial.B.map(m => m.pokemon.name)).toEqual(['keep', 'r1', 'r2']);
    const full = teamsReducer({ A: [], B: six }, { type: 'fillRandom', side: 'B', members: [mon('z')] });
    expect(full.B.map(m => m.pokemon.name)).toEqual(['z']);
  });
});

describe('randomFillCount', () => {
  it('fills empties, or the whole team when full', () => {
    expect(randomFillCount([])).toBe(6);
    expect(randomFillCount(six.slice(0, 4))).toBe(2);
    expect(randomFillCount(six)).toBe(6);
  });
});
```

`lib/showdown/matchup.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { coverage } from './matchup';
import type { Move, TeamMember, TypeName } from '@/lib/battle/types';

const mon = (types: TypeName[], moveTypes: TypeName[]): TeamMember => {
  const moves: Move[] = moveTypes.map(t => ({ name: t, type: t, power: 50, accuracy: 100, damageClass: 'special' }));
  return { pokemon: { id: 1, name: 'x', types, baseStats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }, sprites: { front: null, back: null, artwork: null }, movePool: moves }, moves };
};

describe('coverage', () => {
  it('counts defenders hit super-effectively by any attacker', () => {
    const attackers = [mon(['fire'], ['fire']), mon(['water'], ['water'])];
    const defenders = [mon(['grass'], []), mon(['rock'], []), mon(['dragon'], [])];
    expect(coverage(attackers, defenders)).toBe(2);
  });
  it('is 0 for empty teams', () => {
    expect(coverage([], [mon(['grass'], [])])).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/showdown`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement**

`lib/showdown/teams.ts`:

```ts
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
```

`lib/showdown/matchup.ts`:

```ts
import { typeMultiplier } from '@/data/typeChart';
import type { TeamMember } from '@/lib/battle/types';

export function coverage(attackers: TeamMember[], defenders: TeamMember[]): number {
  return defenders.filter(d =>
    attackers.some(a => a.moves.some(m => typeMultiplier(m.type, d.pokemon.types) >= 2)),
  ).length;
}
```

`lib/showdown/loadMember.ts`:

```ts
import { autoMoveset } from '@/lib/battle/moves';
import type { BattlePokemon, TeamMember } from '@/lib/battle/types';

export async function loadMember(name: string): Promise<TeamMember> {
  const res = await fetch(`/api/pokemon/${encodeURIComponent(name)}`);
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error('upstream');
  const pokemon = (await res.json()) as BattlePokemon;
  return { pokemon, moves: autoMoveset(pokemon.movePool, pokemon.types) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/showdown
git commit -m "feat(showdown): add team reducer, matchup coverage, and member loader"
```

---

### Task 9: Motion foundation and site shell

**Files:**
- Create: `components/motion/SmoothScroll.tsx`, `components/motion/Cursor.tsx`, `components/motion/Reveal.tsx`, `components/motion/GoldParticles.tsx`, `components/SiteNav.tsx`, `components/TiltCard.tsx`, `components/TypeBadge.tsx`, `app/template.tsx`, `app/not-found.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces:
  - `<SmoothScroll>{children}</SmoothScroll>`, `<Cursor />`, `<Reveal className?>{children}</Reveal>`, `<GoldParticles className? count? />`, `<SiteNav />`
  - `<TiltCard src alt width height foil? priority? maxTilt? className? sizes?>{overlay children}</TiltCard>` — children render absolutely positioned over the card image and tilt with it
  - `<TypeBadge type={TypeName} />`

- [ ] **Step 1: Create `components/motion/SmoothScroll.tsx`**

```tsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}
```

- [ ] **Step 2: Create `components/motion/Cursor.tsx`**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fine && !reduce) setEnabled(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    document.body.classList.add('has-cursor');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      const target = e.target as Element | null;
      el.dataset.hover = target?.closest('a,button,input,select,[data-cursor]') ? 'true' : 'false';
    };
    window.addEventListener('pointermove', move);
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.classList.remove('has-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      data-hover="false"
      className="pointer-events-none fixed left-0 top-0 z-[100] -ml-4 -mt-4 size-8 rounded-full border border-gold mix-blend-difference transition-[width,height,margin,background-color] duration-200 data-[hover=true]:-ml-7 data-[hover=true]:-mt-7 data-[hover=true]:size-14 data-[hover=true]:bg-gold/20"
    />
  );
}
```

- [ ] **Step 3: Create `components/motion/Reveal.tsx` and `components/motion/GoldParticles.tsx`**

`Reveal.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(el, { y: 80, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    return () => ctx.revert();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
```

`GoldParticles.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';

export function GoldParticles({ className = '', count = 70 }: { className?: string; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; };
    resize();
    window.addEventListener('resize', resize);
    const ps = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.4,
      v: Math.random() * 0.0006 + 0.0002, a: Math.random() * 0.6 + 0.2,
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 8 * dpr;
      ctx.shadowColor = 'rgba(212,175,55,0.8)';
      for (const p of ps) {
        p.y -= p.v;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,215,122,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [count]);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none size-full ${className}`} />;
}
```

- [ ] **Step 4: Create `components/TiltCard.tsx` and `components/TypeBadge.tsx`**

`TiltCard.tsx`:

```tsx
'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  foil?: boolean;
  priority?: boolean;
  maxTilt?: number;
  className?: string;
  sizes?: string;
  children?: React.ReactNode;
}

export function TiltCard({ src, alt, width, height, foil = false, priority = false, maxTilt = 12, className = '', sizes, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (reduce || !el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * maxTilt * 2}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * maxTilt * 2}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };

  return (
    <div className={`[perspective:1000px] ${className}`}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative overflow-hidden rounded-[4.5%] shadow-[0_30px_80px_-20px_rgba(212,175,55,0.35)] transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
      >
        <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes={sizes} className="h-auto w-full rounded-[4.5%]" />
        {foil && !reduce && <div className="foil-overlay" />}
        {children}
      </div>
    </div>
  );
}
```

`TypeBadge.tsx`:

```tsx
import { TYPE_COLORS } from '@/data/typeColors';
import type { TypeName } from '@/lib/battle/types';

export function TypeBadge({ type }: { type: TypeName }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}
```

- [ ] **Step 5: Create `components/SiteNav.tsx`, `app/template.tsx`, `app/not-found.tsx`**

`SiteNav.tsx`:

```tsx
import Link from 'next/link';

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 mix-blend-difference md:px-16">
      <Link href="/" className="font-serif text-2xl tracking-wide text-gold-light">
        Pokémon <span className="italic">Vault</span>
      </Link>
      <nav className="flex gap-8 text-xs uppercase tracking-[0.3em] text-cream">
        <Link href="/cards" className="transition hover:text-gold-light">The Vault</Link>
        <Link href="/showdown" className="transition hover:text-gold-light">Showdown</Link>
      </nav>
    </header>
  );
}
```

`app/template.tsx`:

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[90] origin-top bg-linear-to-b from-gold-dark via-gold to-gold-light"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        />
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: reduce ? 0 : 0.3 }}>
        {children}
      </motion.div>
    </>
  );
}
```

`app/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-serif text-7xl md:text-9xl">
          A wild <span className="text-gold-gradient italic">MissingNo.</span>
        </h1>
        <p className="mt-6 text-muted">This page fled. It isn’t in the vault.</p>
        <Link href="/" className="btn-gold mt-10">Return home</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Wire the shell into `app/layout.tsx`**

Replace the `<body>` line with:

```tsx
<body className="min-h-screen bg-ink text-cream antialiased">
  <SmoothScroll>
    <Cursor />
    <SiteNav />
    {children}
  </SmoothScroll>
</body>
```

and add the imports:

```tsx
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { Cursor } from '@/components/motion/Cursor';
import { SiteNav } from '@/components/SiteNav';
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run build` → succeeds.
Run `npm run dev` and check http://localhost:3000:
- the gold curtain wipes up on load
- the gold ring cursor follows the mouse and grows over the nav links
- the nav appears top-left and top-right
- http://localhost:3000/nope shows the MissingNo. 404

Then turn on "reduce motion" in OS settings (or DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`) and reload: no curtain, normal cursor. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add components app
git commit -m "feat(ui): add smooth scroll, gold cursor, route curtain, nav, tilt card, and 404"
```

---

### Task 10: Home page

**Files:**
- Create: `components/home/Hero.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getCard`, `FEATURED_CARD_ID`, `Card`, `TiltCard`, `GoldParticles`, `Reveal`.
- Produces: `<Hero card={Card | null} />`.

- [ ] **Step 1: Create `components/home/Hero.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TiltCard } from '@/components/TiltCard';
import { GoldParticles } from '@/components/motion/GoldParticles';
import type { Card } from '@/lib/tcg/types';

function SplitText({ text, charClassName = '' }: { text: string; charClassName?: string }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} data-char aria-hidden className={`inline-block ${charClassName}`}>{c === ' ' ? '\u00A0' : c}</span>
      ))}
    </span>
  );
}

export function Hero({ card }: { card: Card | null }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-char]', { yPercent: 110, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.035, delay: 0.5 });
      gsap.from('[data-hero-fade]', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 1 });
      gsap.from('[data-hero-card]', { y: 80, rotateY: -25, opacity: 0, duration: 1.4, ease: 'power3.out', delay: 0.4 });
      gsap.to('[data-hero-float]', { y: -16, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 md:px-16">
      <GoldParticles className="absolute inset-0" />
      <div className="pointer-events-none absolute -right-40 top-1/4 size-[40rem] rounded-full bg-gold/10 blur-[140px]" />
      <div className="relative z-10 grid w-full items-center gap-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p data-hero-fade className="eyebrow mb-6">The collector’s vault · Est. 1996</p>
          <h1 className="font-serif text-6xl leading-[0.95] md:text-8xl lg:text-9xl">
            <SplitText text="Rare by" />
            <br />
            <SplitText text="design." charClassName="text-gold-gradient italic" />
          </h1>
          <p data-hero-fade className="mt-8 max-w-md text-lg text-muted">
            Pokémon cards ranked from grail to common, with live estimated prices and a guide to what makes each one valuable.
          </p>
          <div data-hero-fade className="mt-10 flex flex-wrap gap-4">
            <Link href="/cards" className="btn-gold">Enter the Vault</Link>
            <Link href="/showdown" className="btn-ghost">Showdown</Link>
          </div>
        </div>
        {card && (
          <div data-hero-card className="mx-auto w-64 md:w-80 lg:w-96">
            <div data-hero-float>
              <TiltCard src={card.images.large} alt={`${card.name} — ${card.setName}`} width={734} height={1024} foil priority sizes="(min-width: 1024px) 384px, 320px" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { Reveal } from '@/components/motion/Reveal';
import { FEATURED_CARD_ID } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';

export const revalidate = 86400;

async function featuredCard() {
  try {
    return await getCard(FEATURED_CARD_ID);
  } catch {
    return null;
  }
}

const FEATURES = [
  { href: '/cards', eyebrow: '01 — The Vault', title: 'From grail to common', body: 'A curated collection ranked by rarity tier, with estimated market prices refreshed daily and a guide to spotting what makes a card valuable.' },
  { href: '/showdown', eyebrow: '02 — Showdown', title: 'Six against six', body: 'Build two teams, then watch them battle on a Gen 2-style screen, decided by stats, speed, and type matchups.' },
];

export default async function Home() {
  const card = await featuredCard();
  return (
    <main>
      <Hero card={card} />
      <section className="grid gap-px border-y border-line bg-line md:grid-cols-2">
        {FEATURES.map(f => (
          <Reveal key={f.href} className="bg-ink">
            <Link href={f.href} className="group block p-10 md:p-16">
              <p className="eyebrow">{f.eyebrow}</p>
              <h2 className="mt-6 font-serif text-5xl transition group-hover:text-gold-light md:text-6xl">{f.title}</h2>
              <p className="mt-6 max-w-md text-muted">{f.body}</p>
              <span className="mt-10 inline-block text-xs uppercase tracking-[0.3em] text-gold transition group-hover:translate-x-2">Explore →</span>
            </Link>
          </Reveal>
        ))}
      </section>
      <footer className="px-6 py-16 text-center text-xs text-muted md:px-16">
        Prices are estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon data from PokéAPI. Not affiliated with Nintendo, Creatures, or Game Freak.
      </footer>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → no errors. Run `npm run dev` and open http://localhost:3000. Expected:
- the headline appears letter by letter
- Charizard floats and tilts toward the cursor with a foil shine
- gold particles drift upward
- the two feature panels reveal on scroll

At 390px width (DevTools device mode), there is no horizontal scroll and the card stacks under the text. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/home
git commit -m "feat(home): add hero with floating foil card, particles, and feature panels"
```

---

### Task 11: Vault ranking page `/cards`

**Files:**
- Create: `components/cards/CardTile.tsx`, `components/cards/TierBand.tsx`, `components/cards/TierIndex.tsx`, `app/cards/page.tsx`

**Interfaces:**
- Consumes: `getCards`, `SHOWCASE`, `groupByTier`, `TIER_META`, `Tier`, `Card`, `formatPrice`, `TiltCard`, `Reveal`.
- Produces: `<CardTile card />`, `<TierBand tier cards />`, `<TierIndex tiers />`. DOM hooks for E2E: `data-testid="tier-band"` on each section, `data-testid="card-tile"` on each card link.

- [ ] **Step 1: Create `components/cards/CardTile.tsx`**

```tsx
import Link from 'next/link';
import { TiltCard } from '@/components/TiltCard';
import { formatPrice } from '@/lib/tcg/normalize';
import type { Card } from '@/lib/tcg/types';

export function CardTile({ card }: { card: Card }) {
  const foil = card.tier === 'grail' || card.tier === 'ultra' || card.tier === 'holo';
  return (
    <Link href={`/cards/${card.id}`} data-testid="card-tile" className="group block">
      <TiltCard src={card.images.small} alt={`${card.name} — ${card.setName}`} width={245} height={342} foil={foil} sizes="(min-width: 1024px) 240px, 45vw" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl leading-tight transition group-hover:text-gold-light">{card.name}</h3>
          <p className="text-xs text-muted">{card.setName} · #{card.number}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted">Estimated</p>
          <p className="font-semibold text-gold-light">{card.price ? formatPrice(card.price) : '—'}</p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `components/cards/TierBand.tsx`**

```tsx
import { Reveal } from '@/components/motion/Reveal';
import { TIER_META, type Tier } from '@/data/rarity';
import type { Card } from '@/lib/tcg/types';
import { CardTile } from './CardTile';

const ACCENT: Record<Tier, string> = {
  grail: 'text-gold-gradient',
  ultra: 'text-[#E5E4E2]',
  holo: 'text-[#C0C0C0]',
  rare: 'text-cream/80',
  uncommon: 'text-cream/60',
  common: 'text-cream/45',
};

export function TierBand({ tier, cards, rank }: { tier: Tier; cards: Card[]; rank: number }) {
  const meta = TIER_META[tier];
  return (
    <section id={`tier-${tier}`} data-tier={tier} data-testid="tier-band" className="scroll-mt-32">
      <Reveal className="mb-12 flex flex-col gap-4 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Tier {String(rank).padStart(2, '0')}</p>
          <h2 className={`font-serif text-6xl italic md:text-8xl ${ACCENT[tier]}`}>{meta.label}</h2>
        </div>
        <p className="max-w-sm text-sm text-muted">{meta.blurb}</p>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map(card => <CardTile key={card.id} card={card} />)}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/cards/TierIndex.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { TIER_META, type Tier } from '@/data/rarity';

export function TierIndex({ tiers }: { tiers: Tier[] }) {
  const [active, setActive] = useState<Tier>(tiers[0]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-tier]'));
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute('data-tier') as Tier);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Rarity tiers" className="sticky top-32 hidden h-fit w-40 shrink-0 lg:block">
      <ol className="space-y-3">
        {tiers.map(t => (
          <li key={t}>
            <a
              href={`#tier-${t}`}
              className={`flex items-center gap-3 text-xs uppercase tracking-[0.3em] transition ${active === t ? 'text-gold-light' : 'text-muted hover:text-cream'}`}
            >
              <span className={`h-px transition-all ${active === t ? 'w-8 bg-gold' : 'w-4 bg-line'}`} />
              {TIER_META[t].label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 4: Create `app/cards/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { TierBand } from '@/components/cards/TierBand';
import { TierIndex } from '@/components/cards/TierIndex';
import { SHOWCASE } from '@/data/showcase';
import { getCards } from '@/lib/tcg/client';
import { groupByTier } from '@/lib/tcg/rank';

export const revalidate = 86400;
export const metadata: Metadata = { title: 'The Vault — Pokémon Vault' };

export default async function CardsPage() {
  const groups = groupByTier(await getCards(SHOWCASE.map(s => s.id)));
  return (
    <main className="px-6 pb-32 pt-36 md:px-16">
      <header className="mb-24 max-w-3xl">
        <p className="eyebrow">Ranked rarest to most common</p>
        <h1 className="mt-4 font-serif text-7xl md:text-9xl">The <span className="text-gold-gradient italic">Vault</span></h1>
        <p className="mt-6 max-w-xl text-muted">
          Estimated market prices from TCGplayer (USD) and Cardmarket (EUR), refreshed daily. Raw, ungraded copies. Graded copies can sell for many times more.
        </p>
      </header>
      <div className="flex gap-16">
        <TierIndex tiers={groups.map(g => g.tier)} />
        <div className="min-w-0 flex-1 space-y-32">
          {groups.map((g, i) => <TierBand key={g.tier} tier={g.tier} cards={g.cards} rank={i + 1} />)}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run build` → `/cards` is listed as ISR (revalidate 1d).
Run `npm run dev` and open http://localhost:3000/cards. Expected:
- tier bands appear in order Grail → Common, each with a big italic label
- cards inside each tier are sorted by price, highest first
- hovering a card tilts it, and holo tiers get a foil shine
- the side index highlights the current tier as you scroll

At 390px width, the grid is 2 columns with no horizontal scroll. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add app/cards components/cards
git commit -m "feat(cards): add rarity-ranked vault page with tier bands and sticky index"
```

---

### Task 12: Card detail page with "How to Identify Value"

**Files:**
- Create: `data/identifyGuide.ts`, `components/cards/PricePanel.tsx`, `components/cards/CardInspector.tsx`, `app/cards/[id]/page.tsx`
- Test: `data/identifyGuide.test.ts`

**Interfaces:**
- Consumes: `getCard`, `SHOWCASE`, `Card`, `Era`, `Price`, `formatPrice`, `variantLabel`, `TIER_META`, `TiltCard`.
- Produces:
  - `interface Region { x: number; y: number; w: number; h: number }` (percentages of card width/height)
  - `interface GuideItem { key: string; title: string; body: string; regions: Partial<Record<Era, Region>> }`
  - `GUIDE: GuideItem[]`, `guideFor(era: Era): { key: string; title: string; body: string; region: Region }[]`
  - `<PricePanel price={Price | null} />`, `<CardInspector card>{infoChildren}</CardInspector>`

- [ ] **Step 1: Write the failing test**

`data/identifyGuide.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { guideFor } from './identifyGuide';

describe('guideFor', () => {
  it('includes the 1st Edition stamp only for vintage cards', () => {
    expect(guideFor('vintage').map(g => g.key)).toContain('edition');
    expect(guideFor('modern').map(g => g.key)).not.toContain('edition');
  });
  it('resolves an in-bounds region for every item', () => {
    for (const era of ['vintage', 'modern'] as const) {
      for (const g of guideFor(era)) {
        expect(g.region.x + g.region.w).toBeLessThanOrEqual(100);
        expect(g.region.y + g.region.h).toBeLessThanOrEqual(100);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- data/identifyGuide.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `data/identifyGuide.ts`**

```ts
import type { Era } from '@/lib/tcg/types';

export interface Region { x: number; y: number; w: number; h: number }

export interface GuideItem { key: string; title: string; body: string; regions: Partial<Record<Era, Region>> }

export const GUIDE: GuideItem[] = [
  {
    key: 'rarity',
    title: 'Rarity symbol',
    body: 'Found at the bottom of the card: ● common, ◆ uncommon, ★ rare. Modern sets use extra and gold stars for illustration, special illustration, and hyper rares, which are the cards that drive set value.',
    regions: { vintage: { x: 86, y: 91, w: 10, h: 5 }, modern: { x: 20, y: 92, w: 12, h: 5 } },
  },
  {
    key: 'number',
    title: 'Set symbol & card number',
    body: 'Tells you exactly which printing you have. A number above the set total (e.g. 199/165) marks a secret rare, almost always the most valuable cards in a set.',
    regions: { vintage: { x: 70, y: 91, w: 16, h: 5 }, modern: { x: 3, y: 92, w: 18, h: 5 } },
  },
  {
    key: 'edition',
    title: '1st Edition stamp',
    body: 'A black “Edition 1” stamp just left of the artwork box marks the first print run and can multiply value 5–10×. On Base Set, “Shadowless” copies (no drop shadow on the right of the art frame) rank next.',
    regions: { vintage: { x: 6, y: 52, w: 12, h: 6 } },
  },
  {
    key: 'holo',
    title: 'Holo pattern & variant',
    body: 'Holofoil artwork, reverse holo (foil on the card body), or textured full art. Each variant has its own market price, so match yours before trusting a number.',
    regions: { vintage: { x: 9, y: 11, w: 82, h: 42 }, modern: { x: 6, y: 9, w: 88, h: 48 } },
  },
  {
    key: 'condition',
    title: 'Condition & grading',
    body: 'Check centering, corners, edges, and surface scratches. A PSA 10 can sell for many times a raw copy, and a PSA 9 often goes for half of a 10. The prices shown here are for raw, ungraded cards.',
    regions: { vintage: { x: 0, y: 0, w: 100, h: 100 }, modern: { x: 0, y: 0, w: 100, h: 100 } },
  },
];

export function guideFor(era: Era) {
  return GUIDE.flatMap(({ regions, ...item }) => {
    const region = regions[era];
    return region ? [{ ...item, region }] : [];
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Create `components/cards/PricePanel.tsx`**

```tsx
import { formatPrice, variantLabel } from '@/lib/tcg/normalize';
import type { Price } from '@/lib/tcg/types';

export function PricePanel({ price }: { price: Price | null }) {
  if (!price) {
    return (
      <div className="border-gold-frame rounded-2xl bg-surface p-8">
        <p className="eyebrow">Estimated value</p>
        <p className="mt-3 font-serif text-4xl text-muted">Price unavailable</p>
        <p className="mt-2 text-sm text-muted">No recent market data for this card.</p>
      </div>
    );
  }
  const fmt = (n: number | null) => (n === null ? '—' : formatPrice({ ...price, market: n }));
  return (
    <div className="border-gold-frame rounded-2xl bg-surface p-8">
      <p className="eyebrow">Estimated value · {variantLabel(price.variant)}</p>
      <p className="mt-3 font-serif text-6xl text-gold-gradient">{formatPrice(price)}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-muted">Low</dt><dd className="text-cream">{fmt(price.low)}</dd></div>
        <div><dt className="text-muted">High</dt><dd className="text-cream">{fmt(price.high)}</dd></div>
      </dl>
      <p className="mt-6 text-xs text-muted">Source: {price.source} · Updated {price.updatedAt}</p>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/cards/CardInspector.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { TiltCard } from '@/components/TiltCard';
import { guideFor } from '@/data/identifyGuide';
import type { Card } from '@/lib/tcg/types';

export function CardInspector({ card, children }: { card: Card; children: React.ReactNode }) {
  const items = guideFor(card.era);
  const [active, setActive] = useState<string | null>(null);
  const region = items.find(i => i.key === active)?.region;

  return (
    <div className="grid gap-16 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <div className="mx-auto w-full max-w-md lg:sticky lg:top-32 lg:h-fit">
        <TiltCard src={card.images.large} alt={`${card.name} — ${card.setName}`} width={734} height={1024} foil priority sizes="(min-width: 1024px) 448px, 90vw">
          {region && (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-md border-2 border-gold-light shadow-[0_0_0_9999px_rgba(10,10,10,0.55),0_0_24px_rgba(245,215,122,0.8)] transition-all duration-300"
              style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.w}%`, height: `${region.h}%` }}
            />
          )}
        </TiltCard>
      </div>
      <div className="space-y-12">
        {children}
        <section>
          <h2 className="font-serif text-4xl">How to <span className="text-gold-gradient italic">identify value</span></h2>
          <p className="mt-2 text-sm text-muted">Hover or focus each point to see where to look on the card.</p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {items.map((item, i) => (
              <li key={item.key}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(item.key)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(item.key)}
                  onBlur={() => setActive(null)}
                  className={`flex w-full gap-6 py-6 text-left transition ${active === item.key ? 'text-gold-light' : ''}`}
                >
                  <span className="font-serif text-2xl text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm text-muted">{item.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `app/cards/[id]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardInspector } from '@/components/cards/CardInspector';
import { PricePanel } from '@/components/cards/PricePanel';
import { TIER_META } from '@/data/rarity';
import { SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';

export const revalidate = 86400;

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SHOWCASE.map(s => ({ id: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const card = await getCard((await params).id);
  return { title: card ? `${card.name} (${card.setName}) — Pokémon Vault` : 'Card not found — Pokémon Vault' };
}

export default async function CardPage({ params }: Params) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();
  const note = SHOWCASE.find(s => s.id === id)?.note;

  return (
    <main className="px-6 pb-32 pt-36 md:px-16">
      <Link href="/cards" className="eyebrow transition hover:text-gold-light">← Back to the Vault</Link>
      <div className="mt-12">
        <CardInspector card={card}>
          <header>
            <p className="eyebrow">{TIER_META[card.tier].label} tier · {card.rarity ?? 'Unknown rarity'}</p>
            <h1 className="mt-4 font-serif text-6xl md:text-7xl">{card.name}</h1>
            <p className="mt-2 text-muted">{card.setName} ({card.setSeries}) · #{card.number} · {card.releaseDate.slice(0, 4)}</p>
          </header>
          <PricePanel price={card.price} />
          {note && <blockquote className="border-l-2 border-gold pl-6 font-serif text-2xl italic text-cream/90">{note}</blockquote>}
        </CardInspector>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit` → no errors. Run `npm run dev` and open http://localhost:3000/cards/base1-4. Expected:
- large tilting Charizard on the left
- price panel with variant, low/high, source, and updated date
- the note quote
- 5 guide items
- hovering "1st Edition stamp" dims the card and spotlights the area left of the artwork box

Open a modern card (e.g. `/cards/sv3pt5-199`): the guide has 4 items and no 1st Edition. Open `/cards/does-not-exist`: the 404 page. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add data/identifyGuide.ts data/identifyGuide.test.ts components/cards app/cards
git commit -m "feat(cards): add card detail page with price panel and identify-value guide"
```

---

### Task 13: Showdown team builder

**Files:**
- Create: `components/showdown/PokemonSearch.tsx`, `components/showdown/StatRadar.tsx`, `components/showdown/TeamPanel.tsx`, `components/showdown/MatchupPreview.tsx`, `components/showdown/Showdown.tsx`, `app/showdown/page.tsx`

**Interfaces:**
- Consumes: `teamsReducer`, `EMPTY_TEAMS`, `MAX_TEAM`, `randomFillCount`, `Teams`, `TeamsAction`, `loadMember`, `coverage`, `getPokemonNames`, `displayName`, `toSlug`, `TypeBadge`, `moveLabel`, `TeamMember`, `EndEvent`, `Side`.
- Produces: `<Showdown names={string[]} />` with phases `build | battle | result`. In this task, `battle` and `result` render placeholders that Task 14 replaces. E2E hooks: `data-testid="search-A"`/`"search-B"` (inputs), `role="option"` results, `data-testid="slot-A-0"` etc., `data-testid="randomize"`, `data-testid="battle-start"`.

- [ ] **Step 1: Create `components/showdown/PokemonSearch.tsx`**

```tsx
'use client';
import { useMemo, useState } from 'react';
import { displayName, toSlug } from '@/lib/pokeapi/names';

interface Props { side: 'A' | 'B'; names: string[]; disabled: boolean; onPick: (slug: string) => void }

export function PokemonSearch({ side, names, disabled, onPick }: Props) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = toSlug(query);
    if (!q) return [];
    const starts = names.filter(n => n.startsWith(q));
    const contains = names.filter(n => !n.startsWith(q) && n.includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [query, names]);

  const pick = (slug: string) => { onPick(slug); setQuery(''); };

  return (
    <div className="relative">
      <input
        data-testid={`search-${side}`}
        value={query}
        disabled={disabled}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && results[0]) pick(results[0]); }}
        placeholder={disabled ? 'Team is full' : 'Search Pokémon…'}
        aria-label={side === 'A' ? 'Add a Pokémon to your team' : 'Add a Pokémon to the opponent team'}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={`search-${side}-list`}
        className="w-full rounded-full border border-line bg-ink px-5 py-3 text-sm outline-none transition placeholder:text-muted focus:border-gold disabled:opacity-40"
      />
      {results.length > 0 && (
        <ul id={`search-${side}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          {results.map(slug => (
            <li key={slug} role="option" aria-selected={false} onClick={() => pick(slug)}
              className="cursor-pointer px-5 py-2.5 text-sm transition hover:bg-gold/10 hover:text-gold-light">
              {displayName(slug)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/showdown/StatRadar.tsx`**

```tsx
import type { StatBlock } from '@/lib/battle/types';

const KEYS: (keyof StatBlock)[] = ['hp', 'atk', 'def', 'spe', 'spd', 'spa'];
const MAX = 200;

export function StatRadar({ stats, size = 64 }: { stats: StatBlock; size?: number }) {
  const c = size / 2, r = size / 2 - 4;
  const point = (i: number, f: number) => {
    const a = (Math.PI * 2 * i) / KEYS.length - Math.PI / 2;
    return `${c + Math.cos(a) * r * f},${c + Math.sin(a) * r * f}`;
  };
  const outline = KEYS.map((_, i) => point(i, 1)).join(' ');
  const shape = KEYS.map((k, i) => point(i, Math.min(stats[k] / MAX, 1))).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Base stats: ${KEYS.map(k => `${k} ${stats[k]}`).join(', ')}`}>
      <polygon points={outline} fill="none" stroke="var(--color-line)" />
      <polygon points={shape} fill="rgba(212,175,55,0.35)" stroke="var(--color-gold)" strokeWidth={1} />
    </svg>
  );
}
```

- [ ] **Step 3: Create `components/showdown/TeamPanel.tsx`**

```tsx
'use client';
import { TypeBadge } from '@/components/TypeBadge';
import { moveLabel } from '@/lib/battle/view';
import type { Side, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import { MAX_TEAM, type TeamsAction } from '@/lib/showdown/teams';
import { PokemonSearch } from './PokemonSearch';
import { StatRadar } from './StatRadar';

interface Props {
  side: Side;
  title: string;
  team: TeamMember[];
  names: string[];
  loading: boolean;
  dispatch: (a: TeamsAction) => void;
  onAdd: (slug: string) => void;
  onRandomize?: () => void;
}

export function TeamPanel({ side, title, team, names, loading, dispatch, onAdd, onRandomize }: Props) {
  return (
    <section className="border-gold-frame rounded-3xl bg-surface/60 p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-serif text-4xl">{title}</h2>
        {onRandomize && (
          <button type="button" data-testid="randomize" onClick={onRandomize} disabled={loading} className="btn-ghost !px-5 !py-2 text-xs">
            🎲 Randomize
          </button>
        )}
      </div>
      <PokemonSearch side={side} names={names} disabled={team.length >= MAX_TEAM || loading} onPick={onAdd} />
      {loading && <p className="mt-3 text-xs text-gold-light">Summoning from the Pokédex…</p>}
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: MAX_TEAM }, (_, i) => {
          const m = team[i];
          if (!m) {
            return <li key={i} className="grid h-36 place-items-center rounded-2xl border border-dashed border-line text-xs uppercase tracking-widest text-muted">Slot {i + 1}</li>;
          }
          return (
            <li key={`${m.pokemon.name}-${i}`} data-testid={`slot-${side}-${i}`} className="relative rounded-2xl border border-line bg-ink p-4">
              <button type="button" aria-label={`Remove ${displayName(m.pokemon.name)}`} onClick={() => dispatch({ type: 'remove', side, index: i })}
                className="absolute right-3 top-3 text-muted transition hover:text-gold-light">✕</button>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.pokemon.sprites.artwork ?? m.pokemon.sprites.front ?? ''} alt="" className="size-14 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{displayName(m.pokemon.name)}</p>
                  <div className="mt-1 flex gap-1">{m.pokemon.types.map(t => <TypeBadge key={t} type={t} />)}</div>
                </div>
                <StatRadar stats={m.pokemon.baseStats} size={52} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {m.moves.map((mv, slot) => (
                  <select
                    key={slot}
                    value={mv.name}
                    aria-label={`Move ${slot + 1} for ${displayName(m.pokemon.name)}`}
                    onChange={e => {
                      const move = m.pokemon.movePool.find(x => x.name === e.target.value);
                      if (move) dispatch({ type: 'setMove', side, index: i, slot, move });
                    }}
                    className="truncate rounded-lg border border-line bg-surface px-2 py-1 text-[10px] uppercase tracking-wide"
                  >
                    {[mv, ...m.pokemon.movePool.filter(x => x.name !== mv.name).sort((a, b) => b.power - a.power)].map(x => (
                      <option key={x.name} value={x.name}>{moveLabel(x.name)} · {x.power}</option>
                    ))}
                  </select>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: Create `components/showdown/MatchupPreview.tsx`**

```tsx
import type { TeamMember } from '@/lib/battle/types';
import { coverage } from '@/lib/showdown/matchup';

export function MatchupPreview({ a, b }: { a: TeamMember[]; b: TeamMember[] }) {
  if (!a.length || !b.length) return null;
  const rows = [
    { label: 'Your team hits super-effectively', value: coverage(a, b), of: b.length },
    { label: 'Opponent hits super-effectively', value: coverage(b, a), of: a.length },
  ];
  return (
    <div className="grid gap-4 rounded-3xl border border-line p-6 sm:grid-cols-2">
      {rows.map(r => (
        <div key={r.label}>
          <p className="eyebrow">{r.label}</p>
          <p className="mt-2 font-serif text-4xl">
            <span className="text-gold-gradient">{r.value}</span>
            <span className="text-muted"> / {r.of}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create `components/showdown/Showdown.tsx`**

```tsx
'use client';
import { useReducer, useState } from 'react';
import type { EndEvent, Side } from '@/lib/battle/types';
import { loadMember } from '@/lib/showdown/loadMember';
import { EMPTY_TEAMS, randomFillCount, teamsReducer } from '@/lib/showdown/teams';
import { MatchupPreview } from './MatchupPreview';
import { TeamPanel } from './TeamPanel';

type Phase = 'build' | 'battle' | 'result';

function sample<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function Showdown({ names }: { names: string[] }) {
  const [teams, dispatch] = useReducer(teamsReducer, EMPTY_TEAMS);
  const [phase, setPhase] = useState<Phase>('build');
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<EndEvent | null>(null);
  const [loading, setLoading] = useState<Record<Side, boolean>>({ A: false, B: false });
  const [toast, setToast] = useState<{ message: string; retry: () => void } | null>(null);

  const withLoading = async (side: Side, job: () => Promise<void>) => {
    setLoading(l => ({ ...l, [side]: true }));
    setToast(null);
    try {
      await job();
    } catch (err) {
      const notFound = err instanceof Error && err.message === 'not_found';
      setToast({ message: notFound ? 'That Pokémon isn’t in the Pokédex.' : 'Couldn’t reach the Pokédex.', retry: () => void withLoading(side, job) });
    } finally {
      setLoading(l => ({ ...l, [side]: false }));
    }
  };

  const add = (side: Side) => (slug: string) =>
    withLoading(side, async () => dispatch({ type: 'add', side, member: await loadMember(slug) }));

  const randomize = () =>
    withLoading('B', async () => {
      const members = await Promise.all(sample(names, randomFillCount(teams.B)).map(loadMember));
      dispatch({ type: 'fillRandom', side: 'B', members });
    });

  const startBattle = () => { setSeed(Date.now()); setResult(null); setPhase('battle'); };
  const canBattle = teams.A.length > 0 && teams.B.length > 0 && !loading.A && !loading.B;

  return (
    <main className="px-6 pb-32 pt-36 md:px-16">
      <header className="mb-16 max-w-3xl">
        <p className="eyebrow">Stats · Speed · Type matchups</p>
        <h1 className="mt-4 font-serif text-7xl md:text-9xl"><span className="text-gold-gradient italic">Showdown</span></h1>
        <p className="mt-6 max-w-xl text-muted">Build two teams of up to six. Every Pokémon fights at level 50 and always uses its strongest move against the current opponent.</p>
      </header>

      {phase === 'build' && (
        <div className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-2">
            <TeamPanel side="A" title="Your Team" team={teams.A} names={names} loading={loading.A} dispatch={dispatch} onAdd={add('A')} />
            <TeamPanel side="B" title="Opponent" team={teams.B} names={names} loading={loading.B} dispatch={dispatch} onAdd={add('B')} onRandomize={randomize} />
          </div>
          <MatchupPreview a={teams.A} b={teams.B} />
          <div className="flex justify-center">
            <button type="button" data-testid="battle-start" className="btn-gold !px-12 !py-4 text-base" disabled={!canBattle} onClick={startBattle}>
              Battle!
            </button>
          </div>
        </div>
      )}

      {phase === 'battle' && (
        <div data-testid="battle-placeholder" data-seed={seed}>Battle screen — Task 14</div>
      )}

      {phase === 'result' && result && <div>Result — Task 14</div>}

      {toast && (
        <div role="alert" className="border-gold-frame fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-surface px-6 py-3 text-sm">
          <span>{toast.message}</span>
          <button type="button" onClick={toast.retry} className="text-gold-light underline underline-offset-4">Retry</button>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="text-muted">✕</button>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Create `app/showdown/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Showdown } from '@/components/showdown/Showdown';
import { getPokemonNames } from '@/lib/pokeapi/client';

export const revalidate = 604800;
export const metadata: Metadata = { title: 'Showdown — Pokémon Vault' };

export default async function ShowdownPage() {
  let names: string[] = [];
  try {
    names = await getPokemonNames();
  } catch {
    names = [];
  }
  return <Showdown names={names} />;
}
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit` → no errors. Run `npm run dev` and open http://localhost:3000/showdown. Expected:
- typing "char" lists Charmander, Charmeleon, Charizard…
- clicking one fills Slot 1 with artwork, type badges, a stat radar, and 4 move dropdowns
- changing a move works
- ✕ removes the Pokémon
- 🎲 Randomize fills the opponent's empty slots; pressing it on a full team replaces all 6
- the matchup preview appears once both teams have members
- Battle! shows the placeholder

The first load of a new Pokémon can take a few seconds while move data is fetched; repeats are instant. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add components/showdown app/showdown
git commit -m "feat(showdown): add team builder with search, randomize, move swap, and matchup preview"
```

---

### Task 14: Battle screen and result screen

**Files:**
- Create: `components/showdown/HpPanel.tsx`, `components/showdown/TextBox.tsx`, `components/showdown/BattleScreen.tsx`, `components/showdown/ResultScreen.tsx`
- Modify: `components/showdown/Showdown.tsx` (replace the two placeholders)

**Interfaces:**
- Consumes: `simulate`, `initView`, `applyEvent`, `teamNames`, `BattleView`, `BattleEvent`, `EndEvent`, `TeamMember`, `Side`, `TYPE_COLORS`, `displayName`.
- Produces:
  - `<BattleScreen teamA teamB seed onFinish={(end: EndEvent) => void} />`
  - `<ResultScreen result teamA teamB onRematch onEdit />`
  - E2E hooks: `data-testid="skip"`, `data-testid="result-banner"`

- [ ] **Step 1: Create `components/showdown/HpPanel.tsx`**

```tsx
interface Props { name: string; hp: number; maxHp: number; showNumbers: boolean; alive: number; total: number }

export function HpPanel({ name, hp, maxHp, showNumbers, alive, total }: Props) {
  const pct = maxHp ? hp / maxHp : 0;
  const color = pct > 0.5 ? 'bg-emerald-400' : pct > 0.2 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="border-gold-frame rounded-xl bg-surface/90 p-3 font-pixel text-[9px] backdrop-blur sm:p-4 sm:text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate">{name}</span>
        <span className="shrink-0 text-gold-light">:L50</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded bg-gold px-1 text-[8px] text-ink sm:text-[10px]">HP</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/70 ring-1 ring-line">
          <div
            role="progressbar"
            aria-label={`${name} HP`}
            aria-valuenow={hp}
            aria-valuemin={0}
            aria-valuemax={maxHp}
            className={`h-full ${color} transition-[width,background-color] duration-700 ease-out`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
      {showNumbers && <p className="mt-2 text-right">{hp}/{maxHp}</p>}
      <div className="mt-2 flex gap-1" aria-label={`${alive} of ${total} Pokémon remaining`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`size-2 rounded-full ${i < alive ? 'bg-gold-light' : 'bg-line'}`} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/showdown/TextBox.tsx`**

The parent remounts this component with `key={messageId}`, so every new message types out from the start.

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function TextBox({ message, speed }: { message: string; speed: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= message.length) return;
    const t = setTimeout(() => setShown(s => s + 1), (reduce ? 8 : 28) / speed);
    return () => clearTimeout(t);
  }, [shown, message, speed, reduce]);

  return (
    <div className="border-gold-frame relative h-full rounded-2xl bg-ink/95 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-gold/30" />
      <p aria-hidden className="font-pixel text-[10px] leading-loose sm:text-sm sm:leading-[2.2]">{message.slice(0, shown)}</p>
      <p className="sr-only" aria-live="polite">{message}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/showdown/BattleScreen.tsx`**

```tsx
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_COLORS } from '@/data/typeColors';
import { simulate } from '@/lib/battle/engine';
import type { BattleEvent, EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { applyEvent, initView, teamNames, type BattleView } from '@/lib/battle/view';
import { HpPanel } from './HpPanel';
import { TextBox } from './TextBox';

const DURATION: Record<BattleEvent['kind'], number> = { switchIn: 1200, useMove: 900, miss: 900, damage: 1100, faint: 1000, end: 1600 };
const SPEEDS = [1, 2, 4] as const;

type Fx = { key: number; kind: 'enter' | 'lunge' | 'hit' | 'faint'; side: Side; color?: string; strong?: boolean };

function fxFor(events: BattleEvent[], i: number): Fx | null {
  const e = events[i];
  if (e.kind === 'switchIn') return { key: i, kind: 'enter', side: e.side };
  if (e.kind === 'useMove') return { key: i, kind: 'lunge', side: e.side };
  if (e.kind === 'faint') return { key: i, kind: 'faint', side: e.side };
  if (e.kind === 'damage' && e.amount > 0) {
    const prev = events[i - 1];
    const color = prev?.kind === 'useMove' ? TYPE_COLORS[prev.move.type] : '#ffffff';
    return { key: i, kind: 'hit', side: e.side, color, strong: e.effectiveness > 1 || e.crit };
  }
  return null;
}

interface Props { teamA: TeamMember[]; teamB: TeamMember[]; seed: number; onFinish: (end: EndEvent) => void }

export function BattleScreen({ teamA, teamB, seed, onFinish }: Props) {
  const events = useMemo(() => simulate(teamA, teamB, seed), [teamA, teamB, seed]);
  const names = useMemo(() => teamNames(teamA, teamB), [teamA, teamB]);
  const [view, setView] = useState<BattleView>(() => initView(teamA, teamB));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [fx, setFx] = useState<Fx | null>(null); // latest effect, drives the screen flash
  const [sideFx, setSideFx] = useState<Record<Side, Fx | null>>({ A: null, B: null }); // latest effect per sprite
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish(events[events.length - 1] as EndEvent);
  }, [events, onFinish]);

  useEffect(() => {
    if (!playing || index >= events.length) return;
    const delay = index === 0 ? 300 : DURATION[events[index - 1].kind] / speed;
    const t = setTimeout(() => {
      setView(v => applyEvent(v, events[index], names));
      const next = fxFor(events, index);
      setFx(next);
      if (next) setSideFx(s => ({ ...s, [next.side]: next }));
      setIndex(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [playing, index, speed, events, names]);

  useEffect(() => {
    if (index < events.length) return;
    const t = setTimeout(finish, 1500 / speed);
    return () => clearTimeout(t);
  }, [index, events.length, finish, speed]);

  const skip = () => {
    setView(v => events.slice(index).reduce((s, e) => applyEvent(s, e, names), v));
    setIndex(events.length);
    finish();
  };

  const alive = (side: Side) => view.fainted[side].filter(f => !f).length;
  const animMs = `${450 / speed}ms`;

  const sprite = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    const team = side === 'A' ? teamA : teamB;
    const p = team[idx].pokemon;
    const src = side === 'A' ? p.sprites.back ?? p.sprites.artwork : p.sprites.front ?? p.sprites.artwork;
    // The key only changes when this sprite gets a new effect, so idle sprites never replay an animation.
    const f = sideFx[side];
    const anim = view.fainted[side][idx] ? 'faint-drop'
      : f?.kind === 'enter' ? (side === 'A' ? 'slide-in-left' : 'slide-in-right')
      : f?.kind === 'lunge' ? (side === 'A' ? 'lunge-a' : 'lunge-b')
      : f?.kind === 'hit' ? (f.strong ? 'shake-strong' : 'shake')
      : null;
    return (
      <div key={`${side}-${idx}-${f?.key ?? 'none'}`} className="relative size-full"
        style={anim ? { animation: `${anim} ${animMs} ease-out both` } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src ?? ''} alt={names[side][idx]} className="size-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" />
      </div>
    );
  };

  const panel = (side: Side) => {
    const idx = view.active[side];
    if (idx === null) return null;
    return (
      <HpPanel name={names[side][idx]} hp={view.hp[side][idx]} maxHp={view.maxHp[side][idx]} showNumbers={side === 'A'}
        alive={alive(side)} total={view.fainted[side].length} />
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="border-gold-frame relative aspect-[4/3] overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,#1d1a12,#0a0a0a_70%)]">
        {/* ground ellipses */}
        <div className="absolute right-[6%] top-[34%] h-[8%] w-[38%] rounded-[50%] bg-gold/15 blur-sm" />
        <div className="absolute bottom-[28%] left-[4%] h-[8%] w-[42%] rounded-[50%] bg-gold/15 blur-sm" />

        <div className="absolute left-[4%] top-[6%] w-[46%]">{panel('B')}</div>
        <div className="absolute right-[8%] top-[4%] size-[34%]">{sprite('B')}</div>
        <div className="absolute bottom-[26%] left-[6%] size-[38%]">{sprite('A')}</div>
        <div className="absolute bottom-[29%] right-[4%] w-[46%]">{panel('A')}</div>

        {fx?.kind === 'hit' && (
          <div key={fx.key} aria-hidden className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: fx.color, animation: `hit-flash ${animMs} ease-out both` }} />
        )}

        <div className="absolute inset-x-[2%] bottom-[2%] h-[24%]">
          <TextBox key={view.messageId} message={view.message} speed={speed} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-ghost !px-5 !py-2 text-xs" onClick={() => setPlaying(p => !p)} disabled={index >= events.length}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <div role="group" aria-label="Battle speed" className="flex overflow-hidden rounded-full border border-gold/50">
          {SPEEDS.map(s => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}
              className={`px-4 py-2 text-xs transition ${speed === s ? 'bg-gold text-ink' : 'text-gold-light hover:bg-gold/10'}`}>
              {s}×
            </button>
          ))}
        </div>
        <button type="button" data-testid="skip" className="btn-gold !px-5 !py-2 text-xs" onClick={skip}>Skip to result</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/showdown/ResultScreen.tsx`**

```tsx
import type { EndEvent, Side, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';

interface Props { result: EndEvent; teamA: TeamMember[]; teamB: TeamMember[]; onRematch: () => void; onEdit: () => void }

export function ResultScreen({ result, teamA, teamB, onRematch, onEdit }: Props) {
  const won = result.winner === 'A';
  const column = (side: Side, team: TeamMember[], title: string) => {
    const dealt = result.damageDealt[side];
    const mvp = dealt.indexOf(Math.max(...dealt));
    const max = Math.max(1, ...dealt);
    return (
      <div className="border-gold-frame rounded-3xl bg-surface/60 p-6">
        <p className="eyebrow">{title}</p>
        <p className="mt-2 font-serif text-3xl">MVP: <span className="text-gold-gradient italic">{displayName(team[mvp].pokemon.name)}</span></p>
        <ul className="mt-6 space-y-3">
          {team.map((m, i) => (
            <li key={i} className="text-sm">
              <div className="flex justify-between"><span>{displayName(m.pokemon.name)}</span><span className="text-muted">{dealt[i]} dmg</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-line">
                <div className={`h-full rounded-full ${i === mvp ? 'bg-gold-light' : 'bg-gold-dark'}`} style={{ width: `${(dealt[i] / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl text-center">
      <h2 data-testid="result-banner" className={`font-serif text-8xl italic md:text-[10rem] ${won ? 'text-gold-gradient' : 'text-muted'}`}>
        {won ? 'VICTORY' : 'DEFEAT'}
      </h2>
      {result.reason === 'turnCap' && <p className="text-sm text-muted">Decided on remaining HP after the 500-turn limit.</p>}
      <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
        {column('A', teamA, 'Your team')}
        {column('B', teamB, 'Opponent')}
      </div>
      <div className="mt-12 flex justify-center gap-4">
        <button type="button" className="btn-gold" onClick={onRematch}>Rematch</button>
        <button type="button" className="btn-ghost" onClick={onEdit}>Edit teams</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire into `components/showdown/Showdown.tsx`**

Add imports:

```tsx
import { BattleScreen } from './BattleScreen';
import { ResultScreen } from './ResultScreen';
```

Replace the two placeholder blocks with:

```tsx
{phase === 'battle' && (
  <BattleScreen
    key={seed}
    teamA={teams.A}
    teamB={teams.B}
    seed={seed}
    onFinish={end => { setResult(end); setPhase('result'); }}
  />
)}

{phase === 'result' && result && (
  <ResultScreen
    result={result}
    teamA={teams.A}
    teamB={teams.B}
    onRematch={startBattle}
    onEdit={() => setPhase('build')}
  />
)}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm test` → all pass. Run `npm run dev` on http://localhost:3000/showdown, build two teams, and press Battle!. Expected:
- the enemy is top-right with its HP panel top-left
- your back sprite is bottom-left with an HP panel and numbers bottom-right
- the text box types "Go! X!" / "Enemy sent out Y!" / "X used MOVE!" / "It's super effective!"
- the attacker lunges; the target shakes with a type-colored flash
- HP bars drain green → yellow → red
- fainted Pokémon drop away and the next slides in
- pokéball dots decrease

Also check:
- 2× and 4× speed things up; Pause halts the battle
- Skip goes straight to VICTORY/DEFEAT with MVPs and damage bars
- Rematch replays with new rolls; Edit teams returns to the builder with teams intact

Stop the server.

- [ ] **Step 7: Commit**

```bash
git add components/showdown
git commit -m "feat(showdown): add Gen 2-style battle screen player and result screen"
```

---

### Task 15: E2E smoke tests and final verification

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`
- Modify: `.gitignore` (add Playwright output folders)

**Interfaces:**
- Consumes: the `data-testid` hooks from Tasks 11, 13, 14.

- [ ] **Step 1: Install the browser and create `playwright.config.ts`**

```bash
npx playwright install chromium
```

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  expect: { timeout: 60_000 },
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 180_000 },
});
```

Append to `.gitignore`:

```
/test-results/
/playwright-report/
```

- [ ] **Step 2: Write `e2e/smoke.spec.ts`**

These tests hit the live Pokémon TCG API and PokéAPI, so they need network access.

```ts
import { test, expect } from '@playwright/test';

test('home renders the hero', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Rare by');
  await expect(page.getByRole('link', { name: 'Enter the Vault' })).toBeVisible();
});

test('vault ranks tiers and opens a card', async ({ page }) => {
  await page.goto('/cards');
  const bands = page.getByTestId('tier-band');
  await expect(bands.first()).toBeVisible();
  const tiers = await bands.evaluateAll(els => els.map(e => e.getAttribute('data-tier')));
  const order = ['grail', 'ultra', 'holo', 'rare', 'uncommon', 'common'];
  expect(tiers).toEqual([...tiers].sort((a, b) => order.indexOf(a!) - order.indexOf(b!)));
  await page.getByTestId('card-tile').first().click();
  await expect(page.getByRole('heading', { name: /identify value/i })).toBeVisible();
  await expect(page.getByText(/Estimated value|Price unavailable/)).toBeVisible();
});

test('unknown card shows the 404', async ({ page }) => {
  await page.goto('/cards/not-a-real-card');
  await expect(page.getByText('MissingNo.')).toBeVisible();
});

test('showdown: build teams, battle, skip to result', async ({ page }) => {
  await page.goto('/showdown');
  await page.getByTestId('search-A').fill('pikachu');
  await page.getByRole('option', { name: 'Pikachu', exact: true }).click();
  await expect(page.getByTestId('slot-A-0')).toBeVisible();
  await page.getByTestId('randomize').click();
  await expect(page.getByTestId('slot-B-5')).toBeVisible();
  await page.getByTestId('battle-start').click();
  await page.getByTestId('skip').click();
  await expect(page.getByTestId('result-banner')).toHaveText(/VICTORY|DEFEAT/);
  await page.getByRole('button', { name: 'Rematch' }).click();
  await expect(page.getByTestId('skip')).toBeVisible();
});
```

- [ ] **Step 3: Run E2E**

Run: `npm run e2e`
Expected: 4 passed. If the showdown test times out on a cold cache, run it again (PokéAPI move data is now cached), and look into it only if it fails twice.

- [ ] **Step 4: Full verification**

Run each and confirm:

```bash
npm test            # all unit tests pass
npx tsc --noEmit    # no type errors
npm run lint        # no lint errors
npm run build       # build succeeds; /cards and /cards/[id] show ISR revalidate 1d
```

Manual pass at 390px and 1440px widths:
- there is no horizontal scroll on any page
- with reduced-motion emulated, there is no curtain, tilt, particles, or smooth scroll, and battle effects are instant cuts

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e .gitignore
git commit -m "test: add Playwright smoke tests for home, vault, card detail, and showdown"
```
