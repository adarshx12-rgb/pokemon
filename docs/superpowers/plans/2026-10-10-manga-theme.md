# Manga Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Home and the Vault as night-ink manga pages (cream ink panels, gold screentone, Dela Gothic One type), with light manga touches on card detail, keeping the black/gold/cream palette.

**Architecture:** Pure geometry/selection logic lives in `lib/manga/` (Vitest-tested). Presentational primitives live in `components/manga/` (`InkPanel`, `PanelReveal`, `SpeechBubble`, `SfxText`, `InkDefs`) backed by CSS utilities in `app/globals.css`. Pages compose them; GSAP ScrollTrigger drives reveals and the pinned Home chapter. Optional Higgsfield illustrations are resolved server-side via `decorSrc()` so every panel renders without them.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, Tailwind v4 (`@theme` tokens), GSAP 3 + ScrollTrigger, Lenis, `next/font/google`, `next/image`, sharp (already installed via Next), Vitest, Playwright, Higgsfield CLI (`gpt_image_2_5`).

**Spec:** `docs/superpowers/specs/2026-10-10-manga-theme-design.md`

## Global Constraints

- Palette unchanged: ink `#0a0a0a`, surface `#141414`, line `#2a2418`, gold `#d4af37`, gold-light `#f5d77a`, gold-dark `#8c6b1f`, cream `#ede6d6`, muted `#8a8375`. No new colours.
- Fonts: Dela Gothic One (`--font-display`, weight 400), Zen Kaku Gothic New (`--font-sans`, 400/500/700), Press Start 2P (`--font-pixel`) unchanged. Cormorant Garamond and Inter removed.
- Dela has no italic: former italic emphasis on Home/Vault/card detail/nav/404 → `text-gold-gradient emph` (skew). Showdown files only get the `font-serif` → `font-display` rename.
- Showdown layout/behaviour untouched (separate cobalt/red/white plan).
- Generated art: no Pokémon characters, Poké Balls, logos or text. Card art stays official scans.
- Higgsfield: model `gpt_image_2_5`, `--quality high --resolution 2k` (2.75 credits/image, quoted 2026-10-10). **Never run `generate create` without first showing the user the exact `generate cost` total and getting an explicit yes in that moment.**
- Decorative SFX/tones/illustrations: `aria-hidden` or `alt=""`. Every animation is skipped under `prefers-reduced-motion`.
- Preserve existing test hooks: `data-testid="tier-band"`, `data-tier`, `data-testid="card-tile"`, h1 accessible name "Rare by design." (via `.sr-only`), link "Enter the Vault", text "MissingNo.".
- Next.js in this repo has breaking changes vs. training data — read `node_modules/next/dist/docs/` for any API you're unsure of (fonts: `01-app/03-api-reference/02-components/font.md`).

## Review Focus

1. **Reduced motion on the pinned chapter** — with `prefers-reduced-motion: reduce`, all 5 chapter panels must be visible with no pin and no hidden content. Pinned in Task 5 Playwright test.
2. **Missing decor files** — before Task 8 runs (or if a file is deleted), pages must render with no broken images or 404 requests to `/decor/*`. Pinned by `decorSrc` unit test (Task 2) and a Playwright "no failed /decor requests" check (Task 4).
3. **Narrow screens (375px)** — hero, chapter and vault must not scroll horizontally (SFX and rotated panels are the usual culprits). Pinned in Task 4 and Task 6 Playwright tests.
4. **Tier with no priced cards / tiny tiers** — splash selection must return `null` when no card has a price or the tier has fewer than 3 cards, so the grid never has a lone 2×2 hole. Pinned by `splashCardId` unit tests (Task 2).
5. **Hero with API down** (`card === null`) — hero must still render h1/CTAs and the right panel shows speed lines without a bubble. Pinned by keeping the Hero card block conditional and the existing h1 smoke test (Task 4).

---

## File Structure

**Create**
- `lib/manga/panel.ts` — polygon shapes, `clipPolygon()`, `svgPoints()`, `wipeFrom()`, named `SHAPES`.
- `lib/manga/panel.test.ts`
- `lib/manga/splash.ts` — `splashCardId(cards)`.
- `lib/manga/splash.test.ts`
- `lib/manga/decor.ts` — `DECOR` names, `decorSrc(name)` (server-only, uses `fs`).
- `lib/manga/decor.test.ts`
- `components/manga/InkDefs.tsx` — hidden SVG filter `#ink-rough`.
- `components/manga/InkPanel.tsx` — clipped panel + inked SVG frame.
- `components/manga/PanelReveal.tsx` — client; clip-path wipe + frame draw-in on scroll.
- `components/manga/SpeechBubble.tsx`
- `components/manga/SfxText.tsx`
- `components/home/Chapter.tsx` — client; pinned 5-panel chapter + zoom-through.
- `components/home/FeaturePanels.tsx`
- `scripts/compress-decor.ts` — PNG → WebP for `public/decor/`.
- `e2e/manga.spec.ts`

**Modify**
- `app/layout.tsx` — fonts, `<InkDefs />`.
- `app/globals.css` — tokens, manga utilities.
- `app/page.tsx`, `components/home/Hero.tsx`
- `app/cards/page.tsx`, `components/cards/TierBand.tsx`, `components/cards/CardTile.tsx`, `components/cards/TierIndex.tsx`
- `app/cards/[id]/page.tsx`, `components/cards/CardInspector.tsx`, `components/cards/PricePanel.tsx`
- `components/SiteNav.tsx`, `app/not-found.tsx`
- `components/showdown/{ResultScreen,Showdown,TeamPanel,MatchupPreview}.tsx` — `font-serif` → `font-display` only.

**Delete**
- `components/motion/Reveal.tsx` (replaced by `PanelReveal`).

---

### Task 1: Fonts, tokens and manga CSS utilities

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, every file containing `font-serif` (see list above)
- Create: `components/manga/InkDefs.tsx`, `e2e/manga.spec.ts`

**Interfaces:**
- Produces: Tailwind `font-display`, `font-sans`; CSS classes `.emph`, `.screentone`, `.screentone-sparse`, `.halftone-fade`, `.speed-lines`, `.caption-box`, `.speech-bubble` (+ `--left|--right|--bottom`), `.sfx`, `.sfx-pop`; SVG filter id `ink-rough`; component `InkDefs()`.

- [ ] **Step 1: Write the failing Playwright test**

Create `e2e/manga.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('headings use Dela Gothic One and body uses Zen Kaku Gothic New', async ({ page }) => {
  await page.goto('/');
  const h1Font = await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily);
  const bodyFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  expect(h1Font).toMatch(/Dela Gothic One/i);
  expect(bodyFont).toMatch(/Zen Kaku Gothic New/i);
  await expect(page.locator('svg filter#ink-rough')).toHaveCount(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test e2e/manga.spec.ts`
Expected: FAIL — h1 font matches Cormorant, not Dela.

- [ ] **Step 3: Create `components/manga/InkDefs.tsx`**

```tsx
/** Shared SVG filters, rendered once in the root layout. `#ink-rough` makes straight strokes look brush-inked. */
export function InkDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
```

- [ ] **Step 4: Update `app/layout.tsx`**

Replace the font imports/constants and `<html>`/`<body>` contents:

```tsx
import type { Metadata } from 'next';
import { Dela_Gothic_One, Press_Start_2P, Zen_Kaku_Gothic_New } from 'next/font/google';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { Cursor } from '@/components/motion/Cursor';
import { MarbleBackground } from '@/components/motion/MarbleBackground';
import { InkDefs } from '@/components/manga/InkDefs';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

const dela = Dela_Gothic_One({ subsets: ['latin'], weight: '400', variable: '--font-dela' });
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-zen-kaku' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });
```

and in the JSX: `className={`${dela.variable} ${zenKaku.variable} ${pixel.variable}`}` on `<html>`, and add `<InkDefs />` as the first child of `<body>` (before `<MarbleBackground />`). Keep `metadata` and the existing comment.

- [ ] **Step 5: Update tokens in `app/globals.css`**

In `@theme`, replace the three font lines with:

```css
  --font-display: var(--font-dela), 'Arial Black', sans-serif;
  --font-sans: var(--font-zen-kaku), system-ui, sans-serif;
  --font-pixel: var(--font-press-start), monospace;
```

- [ ] **Step 6: Add manga utilities to `app/globals.css`**

Append after the `.border-gold-frame` rule (outside `@layer`):

```css
/* ---------- Manga (night-ink) ---------- */
/* Dela Gothic One has no italic: emphasis is a skew instead. */
.emph { display: inline-block; transform: skewX(-8deg); }

/* Flat gold screentone */
.screentone {
  background-image: radial-gradient(rgb(212 175 55 / 0.22) 1.1px, transparent 1.4px);
  background-size: 6px 6px;
}
.screentone-sparse {
  background-image: radial-gradient(rgb(212 175 55 / 0.14) 1px, transparent 1.3px);
  background-size: 11px 11px;
}
/* Gold halftone that fades out toward the top, like manga shading */
.halftone-fade {
  background-image: radial-gradient(rgb(212 175 55 / 0.35) 1.2px, transparent 1.6px);
  background-size: 7px 7px;
  mask-image: linear-gradient(to top, #000 0%, transparent 75%);
}
/* Radial speed-line burst */
.speed-lines {
  background: repeating-conic-gradient(from 0deg at 50% 50%, rgb(237 230 214 / 0.16) 0deg 1.2deg, transparent 1.2deg 6deg);
  mask-image: radial-gradient(circle at 50% 50%, transparent 18%, #000 38%, #000 70%, transparent 100%);
}
.caption-box {
  display: inline-block; border: 2px solid var(--color-cream); background: var(--color-ink);
  padding: 0.25rem 0.75rem; font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--color-cream);
}

.speech-bubble {
  position: relative; display: inline-block; max-width: 18rem;
  background: var(--color-cream); color: var(--color-ink);
  border: 2px solid var(--color-ink); border-radius: 1.5rem;
  box-shadow: 0 0 0 2px var(--color-gold-dark);
  padding: 0.6rem 1.1rem; font-weight: 700; line-height: 1.3;
}
.speech-bubble::after {
  content: ''; position: absolute; width: 1.1rem; height: 1.1rem;
  background: var(--color-cream); border: 2px solid var(--color-ink); border-top: 0; border-left: 0;
}
.speech-bubble--bottom::after { left: 1.5rem; bottom: -0.6rem; transform: rotate(45deg) skew(10deg, 10deg); }
.speech-bubble--left::after { left: -0.6rem; top: 50%; margin-top: -0.55rem; transform: rotate(135deg) skew(10deg, 10deg); }
.speech-bubble--right::after { right: -0.6rem; top: 50%; margin-top: -0.55rem; transform: rotate(-45deg) skew(10deg, 10deg); }

.sfx {
  font-family: var(--font-display); line-height: 1; color: var(--color-ink);
  -webkit-text-stroke: 2px var(--color-gold); paint-order: stroke fill;
  text-shadow: 4px 4px 0 var(--color-gold-dark);
  transform: rotate(-8deg) skewX(-10deg); display: inline-block; pointer-events: none; user-select: none;
}
@keyframes sfx-pop { 0% { transform: rotate(-8deg) skewX(-10deg) scale(0); } 70% { transform: rotate(-8deg) skewX(-10deg) scale(1.15); } 100% { transform: rotate(-8deg) skewX(-10deg) scale(1); } }
.sfx-pop { animation: sfx-pop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both; animation-delay: var(--sfx-delay, 1.4s); }
```

- [ ] **Step 7: Rename `font-serif` → `font-display` everywhere**

Run (Git Bash):

```bash
grep -rl "font-serif" app components | xargs sed -i 's/font-serif/font-display/g'
grep -rn "font-serif" app components   # expect no output
```

- [ ] **Step 8: Replace italic emphasis outside Showdown**

In these exact spots, change `italic` to `emph` (keep `text-gold-gradient`):
- `components/home/Hero.tsx`: `charClassName="text-gold-gradient italic"` → `charClassName="text-gold-gradient"` and wrap that `<SplitText …/>` in `<span className="emph">…</span>` (this hero is rewritten in Task 4; keep it compiling for now).
- `app/cards/page.tsx`: `<span className="text-gold-gradient italic">Vault</span>` → `<span className="text-gold-gradient emph">Vault</span>`.
- `components/cards/TierBand.tsx`: remove `italic` from the h2 className.
- `components/cards/CardInspector.tsx`: `text-gold-gradient italic` → `text-gold-gradient emph`.
- `components/SiteNav.tsx`: `<span className="italic">Vault</span>` → `<span className="emph text-gold-gradient">Vault</span>`.
- `app/not-found.tsx`: `text-gold-gradient italic` → `text-gold-gradient emph`.
- `app/cards/[id]/page.tsx` blockquote: leave for Task 7.

Leave `italic` in `components/showdown/*` untouched.

- [ ] **Step 9: Run tests, lint, typecheck**

Run: `npx playwright test e2e/manga.spec.ts && npx playwright test e2e/smoke.spec.ts && npm test && npm run lint && npx tsc --noEmit`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add -A app components e2e/manga.spec.ts
git commit -m "feat(manga): switch to Dela Gothic One and Zen Kaku fonts and add night-ink utilities"
```

---

### Task 2: Pure manga logic (`lib/manga`)

**Files:**
- Create: `lib/manga/panel.ts`, `lib/manga/panel.test.ts`, `lib/manga/splash.ts`, `lib/manga/splash.test.ts`, `lib/manga/decor.ts`, `lib/manga/decor.test.ts`

**Interfaces:**
- Produces:
  - `type Pt = readonly [number, number]` (percent coordinates 0–100); `type Shape = readonly Pt[]`
  - `RECT: Shape`; `SHAPES: Record<'heroMain'|'heroCard'|'heroInset'|'tiltL'|'tiltR'|'wedgeL'|'wedgeR'|'banner', Shape>`
  - `clipPolygon(shape: Shape): string` → `"polygon(0% 0%, 100% 0%, …)"`
  - `svgPoints(shape: Shape): string` → `"0,0 100,0 …"`
  - `type WipeDir = 'left'|'right'|'up'|'diag'`; `wipeFrom(dir: WipeDir): string` (a CSS `inset()`/`polygon()` clip-path start value); `WIPE_TO: string`
  - `splashCardId(cards: Card[]): string | null`
  - `DECOR = ['hero-hand','vault-door','arena','vault-shelves','grail-spotlight'] as const`; `type DecorName = typeof DECOR[number]`; `decorSrc(name: DecorName, publicDir?: string): string | null`

- [ ] **Step 1: Write failing tests**

`lib/manga/panel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RECT, SHAPES, WIPE_TO, clipPolygon, svgPoints, wipeFrom } from './panel';

describe('clipPolygon', () => {
  it('formats percent points as a CSS polygon', () => {
    expect(clipPolygon(RECT)).toBe('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)');
  });
});

describe('svgPoints', () => {
  it('formats points for an SVG polygon in a 0-100 viewBox', () => {
    expect(svgPoints([[0, 0], [100, 4], [96, 100]])).toBe('0,0 100,4 96,100');
  });
});

describe('SHAPES', () => {
  it('keeps every point inside the 0-100 box', () => {
    for (const shape of Object.values(SHAPES))
      for (const [x, y] of shape) {
        expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(100);
      }
  });
  it('has at least three points per shape', () => {
    for (const shape of Object.values(SHAPES)) expect(shape.length).toBeGreaterThanOrEqual(3);
  });
});

describe('wipeFrom', () => {
  it('hides the panel from the side opposite the wipe origin', () => {
    expect(wipeFrom('left')).toBe('inset(0% 100% 0% 0%)');
    expect(wipeFrom('right')).toBe('inset(0% 0% 0% 100%)');
    expect(wipeFrom('up')).toBe('inset(100% 0% 0% 0%)');
    expect(wipeFrom('diag')).toBe('polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)');
  });
  it('ends fully revealed', () => {
    expect(WIPE_TO).toBe('inset(0% 0% 0% 0%)');
  });
});
```

`lib/manga/splash.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Card, Price } from '@/lib/tcg/types';
import { splashCardId } from './splash';

const price = (market: number): Price => ({ market, low: null, high: null, source: 'TCGplayer', currency: 'USD', variant: null, updatedAt: '2026/10/10' });
const card = (id: string, p: Price | null): Card => ({
  id, name: id, setName: 's', setSeries: 's', number: '1', rarity: null, tier: 'grail', era: 'modern',
  images: { small: '', large: '' }, price: p, releaseDate: '2020-01-01',
});

describe('splashCardId', () => {
  it('picks the highest market price', () => {
    expect(splashCardId([card('a', price(10)), card('b', price(500)), card('c', price(40))])).toBe('b');
  });
  it('ignores unpriced cards', () => {
    expect(splashCardId([card('a', null), card('b', price(5)), card('c', null)])).toBe('b');
  });
  it('returns null when no card is priced', () => {
    expect(splashCardId([card('a', null), card('b', null), card('c', null)])).toBeNull();
  });
  it('returns null for tiers with fewer than 3 cards', () => {
    expect(splashCardId([card('a', price(9)), card('b', price(1))])).toBeNull();
  });
  it('keeps the first card on a tie', () => {
    expect(splashCardId([card('a', price(9)), card('b', price(9)), card('c', price(1))])).toBe('a');
  });
});
```

`lib/manga/decor.test.ts`:

```ts
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DECOR, decorSrc } from './decor';

describe('decorSrc', () => {
  it('returns the public URL when the WebP exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'decor-'));
    mkdirSync(join(dir, 'decor'));
    writeFileSync(join(dir, 'decor', 'arena.webp'), '');
    expect(decorSrc('arena', dir)).toBe('/decor/arena.webp');
  });
  it('returns null when the file is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'decor-'));
    expect(decorSrc('arena', dir)).toBeNull();
  });
  it('lists the five spec assets', () => {
    expect(DECOR).toEqual(['hero-hand', 'vault-door', 'arena', 'vault-shelves', 'grail-spotlight']);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run lib/manga`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `lib/manga/panel.ts`**

```ts
/** A point in percent of the panel box (0-100 on both axes). */
export type Pt = readonly [number, number];
export type Shape = readonly Pt[];

export const RECT: Shape = [[0, 0], [100, 0], [100, 100], [0, 100]];

/** Angled panel outlines. Angles stay small (≤ 6%) so they read on mobile too. */
export const SHAPES = {
  heroMain: [[0, 0], [100, 0], [94, 100], [0, 100]],
  heroCard: [[6, 0], [100, 0], [100, 100], [0, 100]],
  heroInset: [[4, 0], [100, 0], [100, 100], [0, 100]],
  tiltL: [[0, 0], [100, 3], [100, 100], [0, 97]],
  tiltR: [[0, 3], [100, 0], [100, 97], [0, 100]],
  wedgeL: [[0, 0], [100, 0], [96, 100], [0, 100]],
  wedgeR: [[4, 0], [100, 0], [100, 100], [0, 100]],
  banner: [[0, 0], [100, 0], [100, 88], [0, 100]],
} satisfies Record<string, Shape>;

const pct = (n: number) => `${n}%`;

export function clipPolygon(shape: Shape): string {
  return `polygon(${shape.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(', ')})`;
}

export function svgPoints(shape: Shape): string {
  return shape.map(([x, y]) => `${x},${y}`).join(' ');
}

export type WipeDir = 'left' | 'right' | 'up' | 'diag';

/** Clip-path a panel starts from before wiping in from `dir`. */
export function wipeFrom(dir: WipeDir): string {
  switch (dir) {
    case 'left': return 'inset(0% 100% 0% 0%)';
    case 'right': return 'inset(0% 0% 0% 100%)';
    case 'up': return 'inset(100% 0% 0% 0%)';
    case 'diag': return 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)';
  }
}

export const WIPE_TO = 'inset(0% 0% 0% 0%)';
/** End state for the diagonal wipe (polygon and inset can't interpolate into each other). */
export const WIPE_TO_DIAG = 'polygon(0% 0%, 200% 0%, 0% 200%, 0% 0%)';
```

- [ ] **Step 4: Implement `lib/manga/splash.ts`**

```ts
import type { Card } from '@/lib/tcg/types';

/** Smallest tier that gets a 2×2 splash panel; smaller tiers would leave holes in the grid. */
const MIN_CARDS = 3;

/** The tier's highest-priced card, shown as a splash panel, or null when no card qualifies. */
export function splashCardId(cards: Card[]): string | null {
  if (cards.length < MIN_CARDS) return null;
  let best: Card | null = null;
  for (const c of cards) if (c.price && (!best || c.price.market > best.price!.market)) best = c;
  return best?.id ?? null;
}
```

- [ ] **Step 5: Implement `lib/manga/decor.ts`**

```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Optional Higgsfield illustrations in public/decor/. Panels must render fine without them. */
export const DECOR = ['hero-hand', 'vault-door', 'arena', 'vault-shelves', 'grail-spotlight'] as const;
export type DecorName = (typeof DECOR)[number];

/** Public URL of a decor WebP, or null when it hasn't been generated yet. Server-only. */
export function decorSrc(name: DecorName, publicDir = join(process.cwd(), 'public')): string | null {
  return existsSync(join(publicDir, 'decor', `${name}.webp`)) ? `/decor/${name}.webp` : null;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/manga`
Expected: PASS (12 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/manga
git commit -m "feat(manga): add panel geometry, splash selection, and optional decor lookup"
```

---

### Task 3: Manga components

**Files:**
- Create: `components/manga/InkPanel.tsx`, `components/manga/PanelReveal.tsx`, `components/manga/SpeechBubble.tsx`, `components/manga/SfxText.tsx`
- Delete: `components/motion/Reveal.tsx`
- Modify: `app/page.tsx`, `components/cards/TierBand.tsx` (swap `Reveal` → `PanelReveal`)

**Interfaces:**
- Consumes: `Shape`, `RECT`, `clipPolygon`, `svgPoints`, `WipeDir`, `wipeFrom`, `WIPE_TO`, `WIPE_TO_DIAG` from `lib/manga/panel`.
- Produces:
  - `InkPanel({ shape?: Shape; className?: string; style?: React.CSSProperties; children?: React.ReactNode; as?: 'div'|'section'|'article' })` — renders `[data-ink-panel]`, frame strokes `[data-ink-stroke]`.
  - `PanelReveal({ children, dir?: WipeDir; className?: string; delay?: number; immediate?: boolean })` — client; `immediate` animates on mount instead of on scroll.
  - `SpeechBubble({ children, tail?: 'bottom'|'left'|'right'; className?: string })`
  - `SfxText({ children, className?: string; pop?: boolean; delay?: number })`

- [ ] **Step 1: Create `components/manga/InkPanel.tsx`**

```tsx
import { RECT, clipPolygon, svgPoints, type Shape } from '@/lib/manga/panel';

interface Props {
  shape?: Shape;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: 'div' | 'section' | 'article';
}

/** A manga panel: clipped to `shape`, with a brush-inked cream border over a gold inner band. */
export function InkPanel({ shape = RECT, className = '', style, children, as: Tag = 'div' }: Props) {
  const points = svgPoints(shape);
  return (
    <Tag data-ink-panel className={`relative overflow-hidden bg-ink/80 ${className}`} style={{ ...style, clipPath: clipPolygon(shape) }}>
      {children}
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full [filter:url(#ink-rough)]" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Strokes are centred on the clip edge, so only the inner half shows: 6px gold band under a 3px cream line. */}
        <polygon data-ink-stroke points={points} pathLength={1} strokeDasharray={1} fill="none" stroke="var(--color-gold)" strokeOpacity={0.5} strokeWidth={12} vectorEffect="non-scaling-stroke" />
        <polygon data-ink-stroke points={points} pathLength={1} strokeDasharray={1} fill="none" stroke="var(--color-cream)" strokeWidth={6} vectorEffect="non-scaling-stroke" />
      </svg>
    </Tag>
  );
}
```

- [ ] **Step 2: Create `components/manga/PanelReveal.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WIPE_TO, WIPE_TO_DIAG, wipeFrom, type WipeDir } from '@/lib/manga/panel';

interface Props { children: React.ReactNode; dir?: WipeDir; className?: string; delay?: number; immediate?: boolean }

/** Wipes its panel in along `dir` and draws the ink frame, on scroll (or on mount when `immediate`). */
export function PanelReveal({ children, dir = 'left', className = '', delay = 0, immediate = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay, scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 85%' } });
      tl.fromTo(el, { clipPath: wipeFrom(dir) }, { clipPath: dir === 'diag' ? WIPE_TO_DIAG : WIPE_TO, duration: 0.9, ease: 'power3.inOut', clearProps: 'clipPath' });
      tl.fromTo(el.querySelectorAll('[data-ink-stroke]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5');
    }, el);
    return () => ctx.revert();
  }, [dir, delay, immediate]);
  return <div ref={ref} className={className}>{children}</div>;
}
```

- [ ] **Step 3: Create `components/manga/SpeechBubble.tsx`**

```tsx
export function SpeechBubble({ children, tail = 'bottom', className = '' }: { children: React.ReactNode; tail?: 'bottom' | 'left' | 'right'; className?: string }) {
  return <div className={`speech-bubble speech-bubble--${tail} ${className}`}>{children}</div>;
}
```

- [ ] **Step 4: Create `components/manga/SfxText.tsx`**

```tsx
/** Decorative manga sound-effect lettering. Hidden from assistive tech. */
export function SfxText({ children, className = '', pop = false, delay }: { children: string; className?: string; pop?: boolean; delay?: number }) {
  return (
    <span aria-hidden className={`sfx ${pop ? 'sfx-pop' : ''} ${className}`} style={delay === undefined ? undefined : ({ '--sfx-delay': `${delay}s` } as React.CSSProperties)}>
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Replace `Reveal` with `PanelReveal`**

In `app/page.tsx` and `components/cards/TierBand.tsx`: change `import { Reveal } from '@/components/motion/Reveal';` to `import { PanelReveal } from '@/components/manga/PanelReveal';` and every `<Reveal …>`/`</Reveal>` to `<PanelReveal …>`/`</PanelReveal>`. Then:

```bash
git rm components/motion/Reveal.tsx
grep -rn "motion/Reveal" app components   # expect no output
```

- [ ] **Step 6: Verify katakana SFX render in Dela**

Dela Gothic One's `next/font` subsets list no Japanese; glyphs may fall back. Temporarily add `<SfxText className="text-6xl">キラッ!</SfxText>` to `app/not-found.tsx`, run `npm run dev`, open `/does-not-exist`, and check with Playwright:

```bash
npx playwright screenshot --viewport-size=800,600 http://localhost:3000/does-not-exist C:/Users/ADARSH/AppData/Local/Temp/claude/D--PROJECTS-pokemon/ef7302bb-69f4-45f8-979c-df8cb0ca39b0/scratchpad/sfx.png
```

View the screenshot. If the katakana render as tofu boxes or a thin system font, use romaji SFX everywhere this plan says katakana: `キラッ!` → `KIRA!`, `ズラッ` → `ZURA!`, `ドン!` → `DON!`. Record the choice in the Task 3 commit message. Remove the temporary line.

- [ ] **Step 7: Run checks**

Run: `npm test && npm run lint && npx tsc --noEmit && npx playwright test`
Expected: all PASS (smoke still green with PanelReveal).

- [ ] **Step 8: Commit**

```bash
git add -A components app
git commit -m "feat(manga): add InkPanel, PanelReveal, SpeechBubble, and SfxText"
```

---

### Task 4: Home hero spread

**Files:**
- Modify: `components/home/Hero.tsx`, `app/page.tsx`
- Test: `e2e/manga.spec.ts`

**Interfaces:**
- Consumes: `InkPanel`, `PanelReveal`, `SpeechBubble`, `SfxText`, `SHAPES`, `decorSrc`, `formatPrice` (`lib/tcg/normalize`).
- Produces: `Hero({ card: Card | null; handSrc: string | null })`.

- [ ] **Step 1: Add failing tests to `e2e/manga.spec.ts`**

```ts
test('home hero is a 3-panel manga spread', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByTestId('hero');
  await expect(hero.locator('[data-ink-panel]')).toHaveCount(3);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Rare by design.');
});

test('no failed decor requests and no horizontal scroll at 375px', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', r => { if (r.url().includes('/decor/') && r.status() >= 400) failed.push(r.url()); });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(failed).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
```

- [ ] **Step 2: Run to verify the hero test fails**

Run: `npx playwright test e2e/manga.spec.ts -g "3-panel"`
Expected: FAIL — no `data-testid="hero"`.

- [ ] **Step 3: Rewrite `components/home/Hero.tsx`**

```tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TiltCard } from '@/components/TiltCard';
import { GoldParticles } from '@/components/motion/GoldParticles';
import { InkPanel } from '@/components/manga/InkPanel';
import { PanelReveal } from '@/components/manga/PanelReveal';
import { SfxText } from '@/components/manga/SfxText';
import { SpeechBubble } from '@/components/manga/SpeechBubble';
import { SHAPES } from '@/lib/manga/panel';
import { formatPrice } from '@/lib/tcg/normalize';
import type { Card } from '@/lib/tcg/types';

function SplitText({ text, charClassName = '' }: { text: string; charClassName?: string }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
      {[...text].map((c, i) => (
        <span key={i} data-char className={`inline-block ${charClassName}`}>{c === ' ' ? ' ' : c}</span>
      ))}
    </span>
  );
}

export function Hero({ card, handSrc }: { card: Card | null; handSrc: string | null }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-char]', { yPercent: 110, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.035, delay: 0.7 });
      gsap.from('[data-hero-fade]', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 1.1 });
      gsap.to('[data-hero-float]', { y: -16, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} data-testid="hero" className="relative min-h-screen overflow-hidden px-4 pb-12 pt-24 md:px-10">
      <GoldParticles className="absolute inset-0" />
      <div className="relative z-10 grid gap-3 md:min-h-[calc(100vh-8rem)] md:grid-cols-[1.25fr_1fr] md:grid-rows-[1fr_auto]">
        <PanelReveal immediate dir="left" className="md:row-span-2">
          <InkPanel shape={SHAPES.heroMain} className="flex h-full items-end p-8 md:p-14">
            <div aria-hidden className="halftone-fade absolute inset-0" />
            <div className="relative">
              <p data-hero-fade className="caption-box mb-6">The collector’s vault, since 1996</p>
              <h1 className="font-display text-6xl uppercase leading-[0.95] md:text-8xl lg:text-9xl">
                <span className="sr-only">Rare by design.</span>
                <SplitText text="Rare by" />
                <br />
                <span className="emph"><SplitText text="design." charClassName="text-gold-gradient" /></span>
              </h1>
              <p data-hero-fade className="mt-8 max-w-md text-lg text-muted">
                Pokémon cards ranked from grail to common, with live estimated prices and a guide to what makes each one valuable.
              </p>
              <div data-hero-fade className="mt-10 flex flex-wrap gap-4">
                <Link href="/cards" className="btn-gold">Enter the Vault</Link>
                <Link href="/showdown" className="btn-ghost">Showdown</Link>
              </div>
            </div>
          </InkPanel>
        </PanelReveal>

        <PanelReveal immediate dir="right" delay={0.25}>
          <InkPanel shape={SHAPES.heroCard} className="flex h-full min-h-[28rem] items-center justify-center p-8">
            <div aria-hidden className="speed-lines absolute inset-0" />
            {card && (
              <div className="relative w-56 md:w-64 lg:w-72">
                <div data-hero-float>
                  <TiltCard src={card.images.large} alt={`${card.name} — ${card.setName}`} width={734} height={1024} foil priority sizes="(min-width: 1024px) 288px, 256px" />
                </div>
                <SpeechBubble tail="left" className="absolute -right-2 top-6 translate-x-1/3 text-sm max-md:hidden">
                  {card.name}
                  {card.price && <span className="block text-gold-dark">{formatPrice(card.price)}</span>}
                </SpeechBubble>
              </div>
            )}
            <SfxText pop className="absolute bottom-6 left-6 text-5xl md:text-6xl">キラッ!</SfxText>
          </InkPanel>
        </PanelReveal>

        <PanelReveal immediate dir="up" delay={0.45}>
          <InkPanel shape={SHAPES.heroInset} className="screentone relative aspect-[16/9] md:aspect-[5/2]">
            {handSrc && <Image src={handSrc} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />}
          </InkPanel>
        </PanelReveal>
      </div>
    </section>
  );
}
```

(Use `KIRA!` instead of `キラッ!` if Task 3 Step 6 chose romaji.)

- [ ] **Step 4: Pass `handSrc` from `app/page.tsx`**

Add `import { decorSrc } from '@/lib/manga/decor';` and change the hero line to `<Hero card={card} handSrc={decorSrc('hero-hand')} />`.

- [ ] **Step 5: Run tests**

Run: `npx playwright test e2e/manga.spec.ts e2e/smoke.spec.ts`
Expected: PASS. If the 375px overflow test fails, find the offender with `page.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth).map(e => e.className))` and constrain it (e.g. `overflow-hidden` on the panel, smaller SFX size on mobile).

- [ ] **Step 6: Visual check**

With `npm run dev` running, screenshot desktop and mobile into the scratchpad and view both:

```bash
S=C:/Users/ADARSH/AppData/Local/Temp/claude/D--PROJECTS-pokemon/ef7302bb-69f4-45f8-979c-df8cb0ca39b0/scratchpad
npx playwright screenshot --wait-for-timeout=3000 --viewport-size=1440,900 http://localhost:3000/ $S/hero-desktop.png
npx playwright screenshot --wait-for-timeout=3000 --viewport-size=375,812 http://localhost:3000/ $S/hero-mobile.png
```

Check: borders look hand-inked, angled gutters visible, text readable, nothing clipped.

- [ ] **Step 7: Commit**

```bash
git add components/home/Hero.tsx app/page.tsx e2e/manga.spec.ts
git commit -m "feat(home): rebuild hero as a three-panel manga spread"
```

---

### Task 5: Home chapter, feature panels and footer

**Files:**
- Create: `components/home/Chapter.tsx`, `components/home/FeaturePanels.tsx`
- Modify: `app/page.tsx`
- Test: `e2e/manga.spec.ts`

**Interfaces:**
- Consumes: `InkPanel`, `PanelReveal`, `SpeechBubble`, `SfxText`, `SHAPES`, `decorSrc`, `TIER_ORDER`, `TIER_META`.
- Produces: `Chapter({ vaultDoorSrc: string | null; arenaSrc: string | null })`; `FeaturePanels()`.

- [ ] **Step 1: Add failing tests**

```ts
test('home chapter shows five panels', async ({ page }) => {
  await page.goto('/');
  const chapter = page.getByTestId('chapter');
  await chapter.scrollIntoViewIfNeeded();
  await expect(chapter.locator('[data-chapter-panel]')).toHaveCount(5);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('every chapter panel is visible without scrolling animation', async ({ page }) => {
    await page.goto('/');
    const panels = page.getByTestId('chapter').locator('[data-chapter-panel]');
    for (let i = 0; i < 5; i++) {
      await panels.nth(i).scrollIntoViewIfNeeded();
      await expect(panels.nth(i)).toBeVisible();
      expect(await panels.nth(i).evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test e2e/manga.spec.ts -g "chapter"`
Expected: FAIL — no `data-testid="chapter"`.

- [ ] **Step 3: Create `components/home/Chapter.tsx`**

Desktop (≥ 768px, motion allowed): the section is pinned; a scrubbed timeline reveals panels 1–5 in sequence, then scales panel 5 up to fill the viewport (zoom-through). Mobile or reduced motion: no pin; panels stack and use `PanelReveal` (which itself no-ops under reduced motion).

```tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InkPanel } from '@/components/manga/InkPanel';
import { SfxText } from '@/components/manga/SfxText';
import { SpeechBubble } from '@/components/manga/SpeechBubble';
import { TIER_META, TIER_ORDER } from '@/data/rarity';
import { SHAPES, WIPE_TO, wipeFrom } from '@/lib/manga/panel';

function Art({ src }: { src: string | null }) {
  return src
    ? <Image src={src} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-80" />
    : <div aria-hidden className="speed-lines absolute inset-0" />;
}

export function Chapter({ vaultDoorSrc, arenaSrc }: { vaultDoorSrc: string | null; arenaSrc: string | null }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    gsap.registerPlugin(ScrollTrigger);
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const panels = gsap.utils.toArray<HTMLElement>('[data-chapter-panel]', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: '+=2600', pin: true, scrub: 0.6 } });
      panels.forEach((p, i) => {
        tl.fromTo(p, { clipPath: wipeFrom(i % 2 ? 'right' : 'left') }, { clipPath: WIPE_TO, duration: 1, ease: 'none' });
        tl.fromTo(p.querySelectorAll('[data-ink-stroke]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6 }, '<0.2');
      });
      const last = panels[panels.length - 1];
      tl.to(last, { scale: 1.6, zIndex: 30, duration: 1.2, ease: 'power2.in' }, '+=0.3');
      tl.to(panels.slice(0, -1), { opacity: 0, duration: 0.6 }, '<');
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} data-testid="chapter" aria-label="How the vault works" className="relative px-4 py-16 md:flex md:h-screen md:items-center md:px-10 md:py-0">
      <div className="grid w-full gap-3 md:h-[86vh] md:grid-cols-6 md:grid-rows-2">
        <div data-chapter-panel className="min-h-64 md:col-span-3">
          <InkPanel shape={SHAPES.tiltL} as="article" className="h-full">
            <Art src={vaultDoorSrc} />
            <div className="relative flex h-full flex-col justify-end p-8">
              <p className="caption-box w-fit">Chapter 1</p>
              <h2 className="mt-4 font-display text-4xl md:text-5xl">Every card has a story</h2>
            </div>
          </InkPanel>
        </div>
        <div data-chapter-panel className="min-h-64 md:col-span-3">
          <InkPanel shape={SHAPES.tiltR} as="article" className="screentone h-full">
            <div className="flex h-full flex-col justify-between p-8">
              <h2 className="font-display text-4xl md:text-5xl">Ranked by <span className="emph text-gold-gradient">rarity</span></h2>
              <ol className="mt-6 space-y-1 font-display text-lg uppercase">
                {TIER_ORDER.map((t, i) => (
                  <li key={t} style={{ opacity: 1 - i * 0.13 }}>
                    <span className="mr-3 text-gold">{String(i + 1).padStart(2, '0')}</span>{TIER_META[t].label}
                  </li>
                ))}
              </ol>
            </div>
          </InkPanel>
        </div>
        <div data-chapter-panel className="min-h-56 md:col-span-2">
          <InkPanel shape={SHAPES.wedgeL} as="article" className="halftone-fade h-full">
            <div className="flex h-full flex-col justify-between p-8">
              <h2 className="font-display text-3xl md:text-4xl">Priced daily</h2>
              <SpeechBubble className="w-fit">Market price, refreshed every 24h</SpeechBubble>
            </div>
          </InkPanel>
        </div>
        <div data-chapter-panel className="min-h-56 md:col-span-2">
          <InkPanel shape={SHAPES.wedgeR} as="article" className="h-full">
            <Art src={arenaSrc} />
            <div className="relative flex h-full flex-col justify-end p-8">
              <h2 className="font-display text-3xl md:text-4xl">Six against six</h2>
            </div>
          </InkPanel>
        </div>
        <div data-chapter-panel className="relative min-h-56 origin-center md:col-span-2">
          <InkPanel shape={SHAPES.banner} as="article" className="h-full">
            <div aria-hidden className="speed-lines absolute inset-0" />
            <div className="relative flex h-full flex-col items-start justify-center gap-6 p-8">
              <SfxText className="text-5xl">ドン!</SfxText>
              <Link href="/cards" className="btn-gold">Open the Vault</Link>
            </div>
          </InkPanel>
        </div>
      </div>
    </section>
  );
}
```

`InkPanel` doesn't forward `data-*` props, so `data-chapter-panel` sits on a wrapper div around each panel. (Use `DON!` if Task 3 Step 6 chose romaji.)

- [ ] **Step 4: Create `components/home/FeaturePanels.tsx`**

```tsx
import Link from 'next/link';
import { InkPanel } from '@/components/manga/InkPanel';
import { PanelReveal } from '@/components/manga/PanelReveal';
import { SHAPES } from '@/lib/manga/panel';

const FEATURES = [
  { href: '/cards', eyebrow: 'The Vault', title: 'From grail to common', body: 'A curated collection ranked by rarity tier, with estimated market prices refreshed daily and a guide to spotting what makes a card valuable.', shape: SHAPES.wedgeL, dir: 'left' as const },
  { href: '/showdown', eyebrow: 'Showdown', title: 'Six against six', body: 'Build two teams, then watch them battle on a Gen 2-style screen, decided by stats, speed, and type matchups.', shape: SHAPES.wedgeR, dir: 'right' as const },
];

export function FeaturePanels() {
  return (
    <section className="grid gap-3 px-4 py-16 md:grid-cols-2 md:px-10">
      {FEATURES.map(f => (
        <PanelReveal key={f.href} dir={f.dir}>
          <InkPanel shape={f.shape} className="group h-full">
            <div aria-hidden className="speed-lines absolute inset-0 scale-90 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
            <Link href={f.href} className="relative block p-10 transition duration-500 group-hover:scale-[1.02] md:p-16">
              <p className="caption-box">{f.eyebrow}</p>
              <h2 className="mt-6 font-display text-4xl transition group-hover:text-gold-light md:text-5xl">{f.title}</h2>
              <p className="mt-6 max-w-md text-muted">{f.body}</p>
              <span className="speech-bubble speech-bubble--left mt-10 text-sm">Explore</span>
            </Link>
          </InkPanel>
        </PanelReveal>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Compose `app/page.tsx`**

Remove the `FEATURES` constant and the old `<section>`; remove the `Link` and `PanelReveal` imports if unused. Body of `Home`:

```tsx
  const card = await featuredCard();
  return (
    <main>
      <Hero card={card} handSrc={decorSrc('hero-hand')} />
      <Chapter vaultDoorSrc={decorSrc('vault-door')} arenaSrc={decorSrc('arena')} />
      <FeaturePanels />
      <footer className="px-4 pb-16 text-center md:px-10">
        <p className="caption-box mx-auto max-w-2xl normal-case tracking-normal text-muted">
          Prices are estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon data from PokéAPI. Not affiliated with Nintendo, Creatures, or Game Freak.
        </p>
      </footer>
    </main>
  );
```

with imports `Chapter` from `@/components/home/Chapter` and `FeaturePanels` from `@/components/home/FeaturePanels`.

- [ ] **Step 6: Run tests**

Run: `npx playwright test e2e/manga.spec.ts e2e/smoke.spec.ts && npm run lint && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Visual check of the pin**

```bash
S=C:/Users/ADARSH/AppData/Local/Temp/claude/D--PROJECTS-pokemon/ef7302bb-69f4-45f8-979c-df8cb0ca39b0/scratchpad
```

Write a short Playwright script in `$S/chapter-shots.mjs` that opens `/` at 1440×900, scrolls in steps of 600px with `page.mouse.wheel(0, 600)` + 800ms waits, and screenshots each step to `$S/chapter-<n>.png`; run it with `node $S/chapter-shots.mjs` and view the images. Check: panels appear one by one, panel 5 zooms, the features section follows with no blank gap. Lenis smooth scroll is active, so use mouse wheel, not `window.scrollTo`.

- [ ] **Step 8: Commit**

```bash
git add components/home app/page.tsx e2e/manga.spec.ts
git commit -m "feat(home): add pinned manga chapter, feature panels, and caption footer"
```

---

### Task 6: Vault page as manga pages

**Files:**
- Modify: `app/cards/page.tsx`, `components/cards/TierBand.tsx`, `components/cards/CardTile.tsx`, `components/cards/TierIndex.tsx`
- Test: `e2e/manga.spec.ts`

**Interfaces:**
- Consumes: `InkPanel`, `PanelReveal`, `SpeechBubble`, `SfxText`, `SHAPES`, `splashCardId`, `decorSrc`.
- Produces: `TierBand({ tier, cards, rank, backdropSrc?: string | null })`; `CardTile({ card, splash?: boolean })`.

- [ ] **Step 1: Add failing tests**

```ts
test('vault tiers are manga pages with at most one splash each', async ({ page }) => {
  await page.goto('/cards');
  const bands = page.getByTestId('tier-band');
  await expect(bands.first().locator('[data-ink-panel]').first()).toBeVisible();
  const splashCounts = await bands.evaluateAll(els => els.map(e => e.querySelectorAll('[data-splash]').length));
  for (const n of splashCounts) expect(n).toBeLessThanOrEqual(1);
});

test('vault has no horizontal scroll at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/cards');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test e2e/manga.spec.ts -g "vault"`
Expected: FAIL — no `[data-ink-panel]` in tier bands.

- [ ] **Step 3: Rewrite `components/cards/CardTile.tsx`**

```tsx
import Link from 'next/link';
import { TiltCard } from '@/components/TiltCard';
import { InkPanel } from '@/components/manga/InkPanel';
import { SpeechBubble } from '@/components/manga/SpeechBubble';
import { formatPrice } from '@/lib/tcg/normalize';
import type { Card } from '@/lib/tcg/types';

export function CardTile({ card, splash = false }: { card: Card; splash?: boolean }) {
  const foil = card.tier === 'grail' || card.tier === 'ultra' || card.tier === 'holo';
  return (
    <Link href={`/cards/${card.id}`} data-testid="card-tile" data-splash={splash || undefined} className={`group block ${splash ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
      <InkPanel className="h-full p-4">
        <div aria-hidden className="speed-lines absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
        <div className={`relative transition duration-500 group-hover:scale-[1.03] ${splash ? 'mx-auto max-w-sm' : ''}`}>
          <TiltCard src={splash ? card.images.large : card.images.small} alt={`${card.name} — ${card.setName}`} width={splash ? 734 : 245} height={splash ? 1024 : 342} foil={foil} sizes={splash ? '(min-width: 1024px) 384px, 90vw' : '(min-width: 1024px) 240px, 45vw'} />
          {splash && card.price && (
            <SpeechBubble tail="bottom" className="absolute -top-2 right-0 text-sm">{formatPrice(card.price)}</SpeechBubble>
          )}
        </div>
        <div className="relative mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className={`font-display leading-tight transition group-hover:text-gold-light ${splash ? 'text-3xl' : 'text-lg'}`}>{card.name}</h3>
            <p className="truncate text-xs text-muted">{card.setName}, #{card.number}</p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] text-muted">Estimated</p>
            <p className="font-bold text-gold-light">{card.price ? formatPrice(card.price) : '—'}</p>
          </div>
        </div>
      </InkPanel>
    </Link>
  );
}
```

- [ ] **Step 4: Rewrite `components/cards/TierBand.tsx`**

```tsx
import Image from 'next/image';
import { InkPanel } from '@/components/manga/InkPanel';
import { PanelReveal } from '@/components/manga/PanelReveal';
import { TIER_META, type Tier } from '@/data/rarity';
import { SHAPES } from '@/lib/manga/panel';
import { splashCardId } from '@/lib/manga/splash';
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

/** Background intensity steps down with rarity. */
const TONE: Record<Tier, string> = {
  grail: 'speed-lines',
  ultra: 'screentone',
  holo: 'screentone',
  rare: 'screentone-sparse',
  uncommon: 'screentone-sparse',
  common: '',
};

export function TierBand({ tier, cards, rank, backdropSrc = null }: { tier: Tier; cards: Card[]; rank: number; backdropSrc?: string | null }) {
  const meta = TIER_META[tier];
  const splash = splashCardId(cards);
  return (
    <section id={`tier-${tier}`} data-tier={tier} data-testid="tier-band" className="scroll-mt-32">
      <PanelReveal dir={rank % 2 ? 'left' : 'right'} className="mb-3">
        <InkPanel shape={rank % 2 ? SHAPES.tiltL : SHAPES.tiltR} className="flex min-h-56 flex-col justify-end gap-4 p-8 md:flex-row md:items-end md:justify-between md:p-12">
          {backdropSrc && <Image src={backdropSrc} alt="" fill sizes="100vw" className="object-cover opacity-60" />}
          {TONE[tier] && <div aria-hidden className={`${TONE[tier]} absolute inset-0`} />}
          <div className="relative">
            <p className="caption-box">Tier {String(rank).padStart(2, '0')}</p>
            <h2 className={`mt-4 font-display text-6xl uppercase md:text-8xl ${ACCENT[tier]}`}>{meta.label}</h2>
          </div>
          <p className="relative max-w-sm text-sm text-muted">{meta.blurb}</p>
        </InkPanel>
      </PanelReveal>
      <div className="grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map(card => <CardTile key={card.id} card={card} splash={card.id === splash} />)}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Restyle `components/cards/TierIndex.tsx`**

Keep the hook and IntersectionObserver unchanged; replace the `<ol>` contents' `<a>`:

```tsx
            <a
              href={`#tier-${t}`}
              aria-current={active === t ? 'true' : undefined}
              className={`flex items-center gap-3 border-2 px-3 py-2 font-display text-xs uppercase tracking-widest transition ${active === t ? 'border-cream bg-gold text-ink' : 'border-line text-muted hover:border-cream hover:text-cream'}`}
            >
              <span className={active === t ? 'text-ink' : 'text-gold'}>{String(tiers.indexOf(t) + 1).padStart(2, '0')}</span>
              {TIER_META[t].label}
            </a>
```

and change `<ol className="space-y-3">` to `<ol className="space-y-2">`.

- [ ] **Step 6: Rewrite the header in `app/cards/page.tsx`**

Add imports `Image` (`next/image`), `InkPanel`, `SfxText`, `SHAPES`, `decorSrc`. Replace `<header>…</header>` with:

```tsx
      <header className="mb-16">
        <InkPanel shape={SHAPES.banner} className="flex min-h-[22rem] items-end p-8 md:min-h-[28rem] md:p-14">
          {shelves && <Image src={shelves} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />}
          <div aria-hidden className="halftone-fade absolute inset-0" />
          <div className="relative max-w-3xl">
            <p className="caption-box">Ranked rarest to most common</p>
            <h1 className="mt-4 font-display text-7xl uppercase md:text-9xl">The <span className="text-gold-gradient emph">Vault</span></h1>
            <p className="mt-6 max-w-xl text-muted">
              Estimated market prices from TCGplayer (USD) and Cardmarket (EUR), refreshed daily. Raw, ungraded copies. Graded copies can sell for many times more.
            </p>
          </div>
          <SfxText className="absolute right-6 top-6 text-5xl md:right-12 md:top-10 md:text-7xl">ズラッ</SfxText>
        </InkPanel>
      </header>
```

At the top of `CardsPage` add `const shelves = decorSrc('vault-shelves');`, change `<main className="px-6 pb-32 pt-36 md:px-16">` to `<main className="px-4 pb-32 pt-28 md:px-10">`, change `space-y-32` to `space-y-24`, and pass the grail backdrop: `<TierBand key={g.tier} tier={g.tier} cards={g.cards} rank={i + 1} backdropSrc={g.tier === 'grail' ? decorSrc('grail-spotlight') : null} />`. (Use `ZURA!` if Task 3 chose romaji.)

- [ ] **Step 7: Run tests**

Run: `npx playwright test && npm test && npm run lint && npx tsc --noEmit`
Expected: all PASS.

- [ ] **Step 8: Visual check**

Screenshot `/cards` at 1440×900 (full page: add `--full-page`) and 375×812 into the scratchpad; view both. Check splash panels sit cleanly in the grid (no holes), tier intensity steps down, side index tabs readable.

- [ ] **Step 9: Commit**

```bash
git add app/cards/page.tsx components/cards e2e/manga.spec.ts
git commit -m "feat(vault): lay out tiers as manga pages with splash panels and panel-tab index"
```

---

### Task 7: Card detail touches, nav and 404

**Files:**
- Modify: `app/cards/[id]/page.tsx`, `components/cards/CardInspector.tsx`, `components/cards/PricePanel.tsx`, `components/SiteNav.tsx`, `app/not-found.tsx`
- Test: `e2e/manga.spec.ts`

**Interfaces:**
- Consumes: `InkPanel`, `SpeechBubble`, `SfxText`.

- [ ] **Step 1: Add failing test**

```ts
test('card detail uses an ink frame and a speech-bubble note', async ({ page }) => {
  await page.goto('/cards');
  await page.getByTestId('card-tile').first().click();
  await expect(page.getByRole('heading', { name: /identify value/i })).toBeVisible();
  await expect(page.locator('main [data-ink-panel]').first()).toBeVisible();
  await expect(page.locator('main blockquote')).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test e2e/manga.spec.ts -g "card detail"`
Expected: FAIL — no `[data-ink-panel]` on the detail page.

- [ ] **Step 3: Frame the card in `CardInspector.tsx`**

Import `InkPanel`. Wrap the existing `<TiltCard …>…</TiltCard>` so the sticky column reads:

```tsx
      <div className="mx-auto w-full max-w-md lg:sticky lg:top-32 lg:h-fit">
        <InkPanel className="screentone p-6">
          <TiltCard …unchanged… >…unchanged…</TiltCard>
        </InkPanel>
      </div>
```

Also change the guide number span `font-display text-2xl text-gold` (already renamed in Task 1) — no further change.

- [ ] **Step 4: Restyle `PricePanel.tsx`**

Replace both outer `<div className="border-gold-frame rounded-2xl bg-surface p-8">` wrappers with `<InkPanel className="p-8">` (import `InkPanel`), and replace each `<p className="eyebrow">…</p>` inside with `<p className="caption-box">…</p>`. Add, as the first child inside each `InkPanel`, `<div aria-hidden className="screentone absolute inset-x-0 top-0 h-16" />`, and add `relative` to the other direct children's classNames so they sit above it (`<p className="caption-box relative">`, `<p className="relative mt-3 …">`, `<dl className="relative mt-6 …">`, `<p className="relative mt-6 …">`). Keep the text "Estimated value" and "Price unavailable" exactly (smoke test).

- [ ] **Step 5: Note as a speech bubble in `app/cards/[id]/page.tsx`**

Import `SpeechBubble`. Replace:

```tsx
          {note && <blockquote className="border-l-2 border-gold pl-6 font-display text-2xl italic text-cream/90">{note}</blockquote>}
```

with:

```tsx
          {note && <SpeechBubble tail="left" className="max-w-xl text-lg font-medium">{note}</SpeechBubble>}
```

Change `<p className="eyebrow">{TIER_META…}` in the header to `<p className="caption-box">…`. Change `<main className="px-6 pb-32 pt-36 md:px-16">` to `<main className="px-4 pb-32 pt-28 md:px-10">`.

- [ ] **Step 6: Nav and 404**

`components/SiteNav.tsx`: logo className `whitespace-nowrap font-display text-xl tracking-wide text-gold-light md:text-2xl` → `whitespace-nowrap font-display text-lg uppercase tracking-wide text-gold-light md:text-xl`.

`app/not-found.tsx`: import `SfxText`; add `<SfxText className="mb-6 text-6xl">ドン!</SfxText>` above the eyebrow (romaji `DON!` if chosen); change `<p className="eyebrow">Error 404</p>` to `<p className="caption-box">Error 404</p>`; keep the "MissingNo." text.

- [ ] **Step 7: Run tests**

Run: `npx playwright test && npm test && npm run lint && npx tsc --noEmit`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add app components e2e/manga.spec.ts
git commit -m "feat(cards): add ink frame, caption price panel, and speech-bubble note; restyle nav and 404"
```

---

### Task 8: Higgsfield illustrations (credits — needs user approval)

**Files:**
- Create: `scripts/compress-decor.ts`, `public/decor/*.webp` (5 files), `design-assets/decor/*.png` (originals)
- Modify: `.gitignore` only if `design-assets/` originals should stay untracked (check how `design-assets/marble-original.png` is handled: `git check-ignore -v design-assets/marble-original.png`, and follow the same convention).

**Interfaces:**
- Consumes: `DECOR` names from `lib/manga/decor.ts` (filenames must match exactly).

- [ ] **Step 1: Ask whether the user already has images**

The user said they would test prompts locally in GPT Image. Ask: "Do you have any of the five images already? If so, drop the PNGs into `design-assets/decor/` named `hero-hand.png`, `vault-door.png`, `arena.png`, `vault-shelves.png`, `grail-spotlight.png`, and I'll only generate the missing ones." Wait for the answer.

- [ ] **Step 2: Quote exact credits for the missing images**

For each missing image, run `higgsfield generate cost gpt_image_2_5 --prompt "<full prompt>" --quality high --resolution 2k --aspect_ratio <ratio>` (ratios: hero-hand 4:5, vault-door 16:9, arena 16:9, vault-shelves 21:9, grail-spotlight 1:1). Full prompt = the spec's shared style block + a space + that asset's subject prompt (copy both verbatim from spec §4 and the brainstorm prompts below). Sum them, run `higgsfield account status`, and tell the user: "N images × 2.75 = X credits (balance B). Generate?" **Stop and wait for an explicit yes.**

Subject prompts (verbatim):
- hero-hand: `Extreme close-up of a collector's hand in a fitted black glove reaching toward a single trading card resting on a velvet pedestal; the card's face is blank and glowing, emitting radiating gold speed lines. Low angle, tense anticipation, dust motes sparkling in gold.`
- vault-door: `A massive circular bank-vault door swinging open, seen from inside the dark vault; blinding light pours through the gap as dramatic radial speed lines. Heavy bolts, gears and rivets rendered in detailed cross-hatching. A small silhouetted figure stands in the doorway for scale.`
- arena: `An empty ancient stone battle arena at night viewed from a high wide angle, two circular stone platforms facing each other diagonally (one lower-left, one upper-right), cracked floor, crumbling pillars, energy crackling between the platforms as gold lightning, intense manga action-scene atmosphere.`
- vault-shelves: `A long private gallery corridor lined with illuminated glass display cases, each holding a single blank trading card, receding into deep one-point perspective; spotlights cast cones of gold screentone light; polished floor reflecting the cases; quiet, reverent, museum-at-midnight mood.`
- grail-spotlight: `A single blank trading card floating above an ornate pedestal in a pitch-black room, struck by one dramatic spotlight from above; explosive radial speed-line burst behind it, shimmering gold halftone sparkles and light rays, a sense of awe as if revealing a legendary treasure. Centered composition with large empty black margins.`

- [ ] **Step 3: Generate (only after yes)**

Per image: `higgsfield generate create gpt_image_2_5 --prompt "<full prompt>" --quality high --resolution 2k --aspect_ratio <ratio> --wait`, then download the printed result URL with `curl -sL "<url>" -o design-assets/decor/<name>.png`. View each PNG. Reject (and ask before re-rolling — each re-roll is another 2.75 credits) if it contains text/lettering, Pokémon or Poké Balls, or colours beyond black/cream/gold.

- [ ] **Step 4: Create `scripts/compress-decor.ts`**

```ts
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DECOR } from '../lib/manga/decor';

const SRC = join(process.cwd(), 'design-assets', 'decor');
const OUT = join(process.cwd(), 'public', 'decor');
mkdirSync(OUT, { recursive: true });

for (const name of DECOR) {
  const src = join(SRC, `${name}.png`);
  if (!existsSync(src)) { console.log(`skip ${name} (no PNG)`); continue; }
  const info = await sharp(src).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(OUT, `${name}.webp`));
  console.log(`${name}.webp ${Math.round(info.size / 1024)} KB`);
}
```

Run: `npx tsx scripts/compress-decor.ts`
Expected: one line per image, each ≤ ~300 KB. If any is larger, lower quality to 70 for that run.

- [ ] **Step 5: Verify pages pick them up**

Run: `npx playwright test e2e/manga.spec.ts` (the no-failed-decor-requests test now exercises real files), then screenshot `/` and `/cards` at 1440×900 into the scratchpad and view them. Check illustrations blend into black edges; if an edge is hard, add `[mask-image:radial-gradient(closest-side,#000_70%,transparent)]` to that `<Image>`'s className.

- [ ] **Step 6: Commit**

```bash
git add scripts/compress-decor.ts public/decor
git commit -m "feat(manga): add Higgsfield ink illustrations for hero, chapter, and vault"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full suite**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build && npx playwright test`
Expected: all PASS, build succeeds.

- [ ] **Step 2: Showdown regression check**

Screenshot `/showdown` at 1440×900; confirm it still works and only the heading font changed.

- [ ] **Step 3: LCP sanity check**

With `npm run build && npm start`, run `npx lighthouse http://localhost:3000/ --only-categories=performance --quiet --chrome-flags="--headless" --output=json --output-path=$S/lh.json` (S = scratchpad) and read `audits["largest-contentful-paint"].displayValue`. Compare against a run on `git stash`-free baseline commit `e17f32b` (check it out in a worktree if needed). Report both numbers to the user; flag a regression > 500 ms.

- [ ] **Step 4: Report**

Tell the user what shipped, test results, credits spent (from `higgsfield account transactions --size 10`), and anything skipped.
