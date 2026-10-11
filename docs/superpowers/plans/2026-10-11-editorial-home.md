# Editorial Home ("The Grail") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manga home page with an editorial spread. It opens on the site name, then the Rayquaza ★ Gold Star card spins in CSS 3D as you scroll, shedding gold dust over indigo wire-mesh walls, and lands as the Vault door beside a Game Boy Showdown door.

**Architecture:**
- **Pure scroll choreography:** all timing lives in `lib/grail/` as pure, unit-tested functions. `sequence.ts` maps scroll progress `p` (0–1) to poses and opacities, `mesh.ts` projects the wave grid and `particles.ts` runs the glitter.
- **DOM writes, not React state:** one client component, `GrailSequence`, pins the section with GSAP ScrollTrigger and writes those values straight to the DOM every frame. It also writes to a small mutable store that two canvases read: the site-wide `MeshBackground` and the section's `GlitterCanvas`.
- **Static by default:** the server renders a static, stacked layout. That same layout serves no-JS and reduced-motion users. The sequence only layers it into a pinned stage after mount.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, Tailwind CSS 4, GSAP 3 + ScrollTrigger, Lenis, CSS Modules, `sharp` (asset script), Vitest (node env), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-11-editorial-home-design.md`. The approved mockup is in `design-assets/grail/mockup/` (git-ignored; open `index.html?stage=0..3` and `spin.html?a=<deg>` in a browser for reference values).

## Global Constraints

- Colours:
  - Ink: `#050507`.
  - Red `#ff2b2b`: headings and titles only (every Anton element, the logo, the active nav link, key numbers).
  - Indigo `#6e6bff`: all other text.
  - Mesh lines: deep indigo `#4a4dff`. Vertex dots: `#7c78ff`.
  - Gold: card values only (price, glow, glitter, gold edge).
- Fonts: Anton 400 (`--font-display`); JetBrains Mono 400/500 (`--font-sans` and `--font-mono`); Press Start 2P kept (`--font-pixel`). Dela Gothic One and Zen Kaku Gothic New are removed.
- Calls to action are indigo mono uppercase text links with a 1px underline offset 6px, ending in "→". No pill buttons on the home page.
- Glitter is round gold dust only: no stars. Colours `#ffe296`, `#d9b45a`, `#fff1b8`, `#c4963c`; about 7% larger soft motes; cap 2,500 particles on desktop and 1,000 below 768px.
- The hero card is pinned to `ex8-107` (Rayquaza ★, EX Deoxys, 107/107, 2005). Copy never says "most valuable".
- Scroll stages:

  | Stage | p |
  |---|---|
  | welcome | 0–0.08 |
  | to grail | 0.08–0.2 |
  | grail | 0.2–0.3 |
  | turn | 0.3–0.74 |
  | doors | 0.74–1 |

  Pinned scroll distance is 3× the viewport height on desktop and 2× below 768px, so the section is 400vh / 300vh tall.
- Reduced motion and no-JS: no pin, spin, glitter or mesh animation. The page is three stacked screens: welcome, then grail, then doors.
- Next 16: `next/image` `priority` is deprecated, so use `loading="eager"` or `fetchPriority`. Read `node_modules/next/dist/docs/` before using any Next API not already used in this repo (AGENTS.md).
- Keep the TCG retries and snapshot fallback (`lib/tcg/client.ts`). Don't re-enable `cacheComponents`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Resizing or rotating the device mid-sequence:** the card must still land exactly on the Vault door. Covered by an e2e test in Task 8, which resizes at the end.
2. **Short desktop viewports (1280×600):** the "Scroll to open the vault ↓" link is fully visible on first load, and both door links are fully inside the viewport at the end. E2E test in Task 8.
3. **Jumping straight to the end (End key, fast fling):** the flying card is hidden and the Vault door card is shown, with no half-state. E2E test in Task 8.
4. **No price** (API down and the snapshot has no price): the price block disappears and caption 03 reads "Unpriced" instead of breaking. Unit test for `priceCaption` in Task 4.
5. **Leaving the home page mid-sequence:** the mesh on `/cards` returns to its defaults and the glitter stops, with no page errors. Unit test for `resetGrailStore` in Task 4, and an e2e test for home → Vault navigation in Task 8.

---

## File map

| File | Responsibility |
|---|---|
| `scripts/build-grail-assets.ts` (new) | Rounded PNG faces in `design-assets/grail/` → `public/grail/*.webp` |
| `lib/grail/assets.ts` (new) | Public paths and pixel size of the two card faces |
| `lib/grail/sequence.ts` (new) | Pure choreography: `p` → stage, card pose, opacities, mesh shape, glitter rate |
| `lib/grail/mesh.ts` (new) | Pure perspective projection of the wave grid |
| `lib/grail/particles.ts` (new) | Pure particle pool: emit, step, emission count |
| `lib/grail/store.ts` (new) | Mutable per-frame state shared by the sequence and the canvases |
| `lib/grail/format.ts` (new) | Date and price text helpers |
| `components/grail/MeshBackground.tsx` (new) | Fixed full-viewport mesh canvas (all pages) |
| `components/grail/GrailCard.tsx` (new) | CSS 3D card: two faces, gold edges, glint |
| `components/grail/ShowdownDevice.tsx` (new) | Mini Game Boy for the Showdown door |
| `components/grail/Doors.tsx` (new) | The two door links |
| `components/grail/GlitterCanvas.tsx` (new) | Gold-dust canvas |
| `components/grail/GrailSequence.tsx` (new) | Section markup plus the pinned ScrollTrigger sequence |
| `components/grail/grail.module.css` (new) | Static and sequenced layouts for the section |
| `components/motion/SmoothScroll.tsx` | Also exports `scrollToY` (Lenis-aware) |
| `components/SiteNav.tsx` | Editorial nav with active state |
| `app/layout.tsx`, `app/globals.css` | Fonts, tokens, shared text utilities, mesh background |
| `app/cards/layout.tsx` (new) | Mounts `InkDefs` for the Vault pages, which are still manga |
| `app/page.tsx`, `app/template.tsx`, `app/not-found.tsx` | Home, curtain, 404 |
| `data/showcase.ts` | `GRAIL` constant replaces `FEATURED_CARD_ID` |
| `e2e/home.spec.ts` (new), `e2e/smoke.spec.ts`, `e2e/manga.spec.ts` | Browser tests |
| Deleted | `components/home/*`, `components/motion/MarbleBackground.tsx`, `components/motion/GoldParticles.tsx`, `lib/parallax.ts`, `lib/parallax.test.ts`, `public/marble*.webp`, `public/decor/{hero-hand,vault-door,arena}.webp` |

---

### Task 1: Grail data, card-face assets, and spec clarifications

**Files:**
- Create: `scripts/build-grail-assets.ts`, `lib/grail/assets.ts`, `lib/grail/assets.test.ts`, `public/grail/rayquaza-front-1200.webp`, `public/grail/rayquaza-back-1200.webp`
- Modify: `data/showcase.ts:1`, `package.json` (scripts), `docs/superpowers/specs/2026-10-11-editorial-home-design.md`

**Interfaces:**
- Produces:
  - `GRAIL` from `@/data/showcase`: `{ id: 'ex8-107'; name: 'Rayquaza'; setName: 'EX Deoxys'; number: '107/107'; year: '2005' }`
  - `GRAIL_FACES` from `@/lib/grail/assets`: `{ front: string; back: string }`
  - `FACE_SIZE`: `{ width: 1200; height: 1645 }`
- Removes: `FEATURED_CARD_ID`. Its only user is `app/page.tsx`, which Task 7 rewrites, so for now change `app/page.tsx` to import `GRAIL` and call `getCard(GRAIL.id)`.

- [ ] **Step 1: Write the failing test** `lib/grail/assets.test.ts`

```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { FACE_SIZE, GRAIL_FACES } from './assets';

describe('grail card faces', () => {
  for (const face of ['front', 'back'] as const) {
    it(`${face} WebP exists at the declared size, with transparent corners`, async () => {
      const file = join(process.cwd(), 'public', GRAIL_FACES[face]);
      expect(existsSync(file)).toBe(true);
      const meta = await sharp(file).metadata();
      expect(meta.width).toBe(FACE_SIZE.width);
      expect(meta.height).toBe(FACE_SIZE.height);
      expect(meta.hasAlpha).toBe(true);
      const corner = await sharp(file).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
      expect(corner[3]).toBe(0); // alpha of the top-left pixel: rounded corner is see-through
    });
  }
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/grail/assets.test.ts`
Expected: FAIL with `Cannot find module './assets'`.

- [ ] **Step 3: Add the assets module, data constant and build script**

`lib/grail/assets.ts`:

```ts
/** The home page's 3D card faces, built by scripts/build-grail-assets.ts from design-assets/grail/. */
export const GRAIL_FACES = {
  front: '/grail/rayquaza-front-1200.webp',
  back: '/grail/rayquaza-back-1200.webp',
} as const;

/** Pixel size of both faces (official scan ratio 2988×4096). */
export const FACE_SIZE = { width: 1200, height: 1645 } as const;
```

In `data/showcase.ts`, replace line 1 (`export const FEATURED_CARD_ID = 'base1-4';`) with:

```ts
/**
 * The home page's grail. The 3D faces in public/grail/ are made for this exact card, so this is an
 * editorial pick, not "the most expensive card" (prices move; Umbreon VMAX is close behind).
 */
export const GRAIL = { id: 'ex8-107', name: 'Rayquaza', setName: 'EX Deoxys', number: '107/107', year: '2005' } as const;
```

In `app/page.tsx`, change `import { FEATURED_CARD_ID } from '@/data/showcase';` to `import { GRAIL } from '@/data/showcase';` and `getCard(FEATURED_CARD_ID)` to `getCard(GRAIL.id)`.

`scripts/build-grail-assets.ts`:

```ts
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { FACE_SIZE } from '../lib/grail/assets';

// Sources are git-ignored: front = official scan upscaled 4K by Higgsfield (no redraw), rounded;
// back = Higgsfield GPT Image 2.5 black glass with a gold border, rounded. See the spec, section 5.
const SRC = join(process.cwd(), 'design-assets', 'grail');
const OUT = join(process.cwd(), 'public', 'grail');
const FACES = { front: 'front-rounded.png', back: 'back-rounded.png' } as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const [face, file] of Object.entries(FACES)) {
    const src = join(SRC, file);
    if (!existsSync(src)) throw new Error(`Missing ${src}. It is produced in the design pass (see spec section 5).`);
    const out = join(OUT, `rayquaza-${face}-${FACE_SIZE.width}.webp`);
    // next/image re-encodes at quality 75 per requested width, so keep the source near-lossless.
    const info = await sharp(src)
      .resize({ width: FACE_SIZE.width, height: FACE_SIZE.height, fit: 'fill' })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(out);
    console.log(`${out} ${Math.round(info.size / 1024)} KB`);
  }
}

main();
```

In `package.json` `scripts`, add `"build:grail": "tsx scripts/build-grail-assets.ts",` after `"snapshot:showcase"`.

- [ ] **Step 4: Build the assets and run the test**

Run: `npm run build:grail && npx vitest run lib/grail/assets.test.ts`
Expected: two lines like `…rayquaza-front-1200.webp 3xx KB`, then the test PASSES.

- [ ] **Step 5: Record the plan's clarifications in the spec**

Append to the end of `docs/superpowers/specs/2026-10-11-editorial-home-design.md`:

```markdown
## Clarifications (implementation plan, 2026-10-11)

- 404 headline stays "A wild MissingNo." (existing test and tone) in the new Anton/indigo style.
- "Prices updated {date}" appears in the welcome screen's facts list, not the nav: the nav lives in the shared layout and has no page data.
- Mobile doors sit side by side at 160×219 so both fit the pinned screen; desktop viewports 760px tall or less use 200×274 doors.
- The Vault door image has empty alt text; the link is named by its own text ("01 — The collection Vault Enter the vault →").
- Footer copy is indigo (red at 70% opacity would fail AA for small text).
- One 1200px WebP per face; next/image builds the srcset.
- Body text colour stays cream on the not-yet-restyled pages; the home section sets indigo itself.
```

- [ ] **Step 6: Commit**

```bash
git add lib/grail/assets.ts lib/grail/assets.test.ts scripts/build-grail-assets.ts public/grail data/showcase.ts app/page.tsx package.json docs/superpowers/specs/2026-10-11-editorial-home-design.md
git commit -m "feat(grail): add Rayquaza card faces and the GRAIL pick

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Scroll choreography (`lib/grail/sequence.ts`)

**Files:**
- Create: `lib/grail/sequence.ts`, `lib/grail/sequence.test.ts`

**Interfaces:**
- Consumes: `MeshShape`, `MESH_DEFAULT` from `./mesh` (Task 3). To keep this task independent, Step 3 creates `lib/grail/mesh.ts` with just those two exports; Task 3 fills in the rest.
- Produces (all pure; `p` is 0–1):
  - `BOUNDS = { welcome: 0.08, toGrail: 0.2, grail: 0.3, turn: 0.74 }`, `HANDOFF = 0.98`
  - `type Stage = 'welcome' | 'toGrail' | 'grail' | 'turn' | 'doors'`
  - `interface Rect { left: number; top: number; width: number; height: number }`
  - `interface Pose { rx: number; ry: number; rz: number; skew: number; scale: number; x: number; y: number; opacity: number }`
  - `seg(p, a, b)`, `lerp(a, b, t)`, `easeInOut(t)`
  - `stageAt(p): Stage`
  - `spinAngle(p): number` (0–360)
  - `cardPose(p, home: Rect, door: Rect): Pose`
  - `poseTransform(pose: Pose): string`
  - `glintStyle(p): { x: number; opacity: number }` (x in %)
  - `welcomeStyle(p): { opacity: number; y: number }`
  - `headlineStyle(p): { opacity: number; scale: number; y: number }`
  - `grailCopyOpacity(p): number`
  - `captionAt(p): -1 | 0 | 1 | 2`
  - `ruleStyle(p): { opacity: number; fill: number }`
  - `doorsStyle(p): { titleOpacity: number; titleY: number; showdownOpacity: number; showdownX: number; doorCardOpacity: number }`
  - `glitterRate(p): number` (0–1)
  - `meshShape(p): MeshShape`
  - `meshLightStrength(p): number`

- [ ] **Step 1: Write the failing tests** `lib/grail/sequence.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { MESH_DEFAULT } from './mesh';
import {
  BOUNDS, HANDOFF, captionAt, cardPose, doorsStyle, glitterRate, grailCopyOpacity, headlineStyle,
  meshShape, poseTransform, spinAngle, stageAt, welcomeStyle, type Rect,
} from './sequence';

const home: Rect = { left: 565, top: 268, width: 310, height: 425 };
const door: Rect = { left: 490, top: 205, width: 270, height: 370 };
const mod360 = (a: number) => ((a % 360) + 360) % 360;
const samples = (from: number, to: number, n = 400) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

describe('stageAt', () => {
  it('splits progress at the spec boundaries', () => {
    expect(stageAt(0)).toBe('welcome');
    expect(stageAt(BOUNDS.welcome)).toBe('toGrail');
    expect(stageAt(0.25)).toBe('grail');
    expect(stageAt(0.5)).toBe('turn');
    expect(stageAt(BOUNDS.turn)).toBe('doors');
    expect(stageAt(1)).toBe('doors');
  });
});

describe('spinAngle', () => {
  it('is 0 before the turn, 360 after it, and never goes backwards', () => {
    expect(spinAngle(0.25)).toBe(0);
    expect(spinAngle(0.8)).toBe(360);
    const angles = samples(BOUNDS.grail, BOUNDS.turn).map(spinAngle);
    angles.slice(1).forEach((a, i) => expect(a).toBeGreaterThanOrEqual(angles[i]));
  });
});

describe('cardPose', () => {
  it('is hidden on the welcome screen', () => {
    expect(cardPose(0, home, door).opacity).toBe(0);
  });
  it('rests at its home tilt on the grail screen', () => {
    const pose = cardPose(0.25, home, door);
    expect(pose).toMatchObject({ rx: 10, ry: -24, rz: -5, x: 0, y: 0, scale: 1, opacity: 1 });
    expect(pose.skew).toBeCloseTo(0);
  });
  it('lands on the Vault door at p = 1, at the door tilt and size', () => {
    const pose = cardPose(1, home, door);
    expect(pose.x).toBeCloseTo(door.left + door.width / 2 - (home.left + home.width / 2));
    expect(pose.y).toBeCloseTo(door.top + door.height / 2 - (home.top + home.height / 2));
    expect(pose.scale).toBeCloseTo(door.width / home.width);
    expect(mod360(pose.ry)).toBeCloseTo(14);
    expect(pose.rz).toBeCloseTo(-2);
    expect(pose.rx).toBeCloseTo(0);
  });
  it('hands off to the door card over the last 2% with no gap or double image', () => {
    for (const p of samples(HANDOFF, 1, 20)) {
      expect(cardPose(p, home, door).opacity + doorsStyle(p).doorCardOpacity).toBeCloseTo(1);
    }
    expect(cardPose(1, home, door).opacity).toBe(0);
    expect(doorsStyle(1).doorCardOpacity).toBe(1);
  });
});

describe('poseTransform', () => {
  it('translates, scales, then rotates X, Z, Y and skews, in that order', () => {
    expect(poseTransform({ rx: 1, ry: 2, rz: 3, skew: 4, scale: 0.5, x: 6, y: 7, opacity: 1 }))
      .toBe('translate3d(6px, 7px, 0) scale(0.5) rotateX(1deg) rotateZ(3deg) rotateY(2deg) skewY(4deg)');
  });
});

describe('glitterRate', () => {
  it('is zero on the welcome screen and never above 1', () => {
    expect(glitterRate(0)).toBe(0);
    for (const p of samples(0, 1)) expect(glitterRate(p)).toBeLessThanOrEqual(1);
  });
  it('peaks while the card is edge-on, not face-on', () => {
    const turn = samples(BOUNDS.grail, BOUNDS.turn);
    const peak = turn.reduce((best, p) => (glitterRate(p) > glitterRate(best) ? p : best));
    const angle = mod360(spinAngle(peak));
    expect(Math.min(Math.abs(angle - 90), Math.abs(angle - 270))).toBeLessThan(25);
    const backFaceOn = turn.find(p => spinAngle(p) >= 180)!;
    expect(glitterRate(backFaceOn)).toBeLessThan(glitterRate(peak) / 2);
  });
});

describe('captions and copy', () => {
  it('shows captions 0, 1, 2 in order through the turn only', () => {
    expect(captionAt(0.25)).toBe(-1);
    expect(captionAt(0.31)).toBe(0);
    expect(captionAt(0.52)).toBe(1);
    expect(captionAt(0.73)).toBe(2);
    expect(captionAt(0.8)).toBe(-1);
  });
  it('fades the welcome out and the headline in, then the headline out at the doors', () => {
    expect(welcomeStyle(0).opacity).toBe(1);
    expect(welcomeStyle(BOUNDS.toGrail).opacity).toBe(0);
    expect(headlineStyle(0).opacity).toBe(0);
    expect(headlineStyle(0.25).opacity).toBe(1);
    expect(headlineStyle(0.9).opacity).toBe(0);
  });
  it('shows the grail copy only on the grail screen', () => {
    expect(grailCopyOpacity(0)).toBe(0);
    expect(grailCopyOpacity(0.25)).toBe(1);
    expect(grailCopyOpacity(0.5)).toBe(0);
  });
});

describe('meshShape', () => {
  it('starts at the default shape and ends pulled back to the edges', () => {
    expect(meshShape(0)).toEqual(MESH_DEFAULT);
    expect(meshShape(1).open).toBeCloseTo(0.62);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/grail/sequence.test.ts`
Expected: FAIL with `Cannot find module './mesh'` or `'./sequence'`.

- [ ] **Step 3: Create the mesh types and the sequence module**

`lib/grail/mesh.ts` (Task 3 adds the projection below these lines):

```ts
/** Shape of the two indigo mesh walls. horizon is a fraction of the canvas height. */
export interface MeshShape { open: number; height: number; amp: number; horizon: number }

/** Resting shape, tuned at 1440×900 in the approved mockup. */
export const MESH_DEFAULT: MeshShape = { open: 0.36, height: 1500, amp: 1.6, horizon: 0.52 };
```

`lib/grail/sequence.ts`:

```ts
import { MESH_DEFAULT, type MeshShape } from './mesh';

/**
 * Scroll choreography for the home "grail" section. p runs 0→1 across the pinned scroll.
 * Pure (no DOM) so every stage boundary can be tested; GrailSequence applies the results.
 */
export const BOUNDS = { welcome: 0.08, toGrail: 0.2, grail: 0.3, turn: 0.74 } as const;
/** The flying card crossfades into the real Vault door card over [HANDOFF, 1]. */
export const HANDOFF = 0.98;

export type Stage = 'welcome' | 'toGrail' | 'grail' | 'turn' | 'doors';
export interface Rect { left: number; top: number; width: number; height: number }
export interface Pose { rx: number; ry: number; rz: number; skew: number; scale: number; x: number; y: number; opacity: number }

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 as p goes a→b, clamped. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const rad = (deg: number) => (deg * Math.PI) / 180;

export function stageAt(p: number): Stage {
  if (p < BOUNDS.welcome) return 'welcome';
  if (p < BOUNDS.toGrail) return 'toGrail';
  if (p < BOUNDS.grail) return 'grail';
  if (p < BOUNDS.turn) return 'turn';
  return 'doors';
}

/** Rotation about Y added on top of the resting tilt: one full eased turn. */
export function spinAngle(p: number): number {
  return 360 * easeInOut(seg(p, BOUNDS.grail, BOUNDS.turn));
}

const REST = { rx: 10, ry: -24, rz: -5 };
/** Matches the .vaultCard tilt in grail.module.css. */
const DOOR_TILT = { rx: 0, ry: 14, rz: -2 };
const centre = (r: Rect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** Pose of the flying card. home is its resting box and door the Vault door's card box, in the same coordinates. */
export function cardPose(p: number, home: Rect, door: Rect): Pose {
  const a = rad(spinAngle(p));
  const turn = Math.abs(Math.sin(a));
  const enter = seg(p, BOUNDS.welcome, BOUNDS.toGrail);
  const fly = easeInOut(seg(p, BOUNDS.turn, 1));
  const hc = centre(home);
  const dc = centre(door);
  return {
    rx: lerp(REST.rx - 8 * turn, DOOR_TILT.rx, fly),
    // Keep turning the same way into the door tilt (336° → 374°) instead of unwinding.
    ry: lerp(REST.ry + spinAngle(p), 360 + DOOR_TILT.ry, fly),
    rz: lerp(REST.rz + 10 * Math.sin(a / 2), DOOR_TILT.rz, fly),
    skew: -5 * Math.sin(a) * (1 - fly),
    scale: lerp(0.85, 1, easeInOut(enter)) * lerp(1, door.width / home.width, fly),
    x: lerp(0, dc.x - hc.x, fly),
    y: lerp(0, dc.y - hc.y, fly),
    opacity: enter * (1 - seg(p, HANDOFF, 1)),
  };
}

export function poseTransform(pose: Pose): string {
  return `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale}) rotateX(${pose.rx}deg) rotateZ(${pose.rz}deg) rotateY(${pose.ry}deg) skewY(${pose.skew}deg)`;
}

/** Light band across the card face: slides with the angle, brightest edge-on. */
export function glintStyle(p: number): { x: number; opacity: number } {
  const a = spinAngle(p);
  return { x: -60 + ((a % 180) / 180) * 120, opacity: 0.35 + 0.65 * Math.abs(Math.sin(rad(a))) };
}

export function welcomeStyle(p: number): { opacity: number; y: number } {
  return { opacity: 1 - seg(p, BOUNDS.welcome, BOUNDS.welcome + 0.08), y: lerp(0, -80, seg(p, BOUNDS.welcome, BOUNDS.toGrail)) };
}

export function headlineStyle(p: number): { opacity: number; scale: number; y: number } {
  const enter = easeInOut(seg(p, BOUNDS.welcome + 0.02, BOUNDS.toGrail));
  const t = seg(p, BOUNDS.grail, BOUNDS.turn);
  const out = seg(p, BOUNDS.turn, BOUNDS.turn + 0.1);
  return { opacity: enter * lerp(1, 0.2, t) * (1 - out), scale: lerp(1, 1.15, t), y: lerp(60, 0, enter) };
}

/** Meta lines, "GOLD STAR" copy, price and side label of the grail screen. */
export function grailCopyOpacity(p: number): number {
  return seg(p, 0.14, BOUNDS.toGrail) * (1 - seg(p, BOUNDS.grail, BOUNDS.grail + 0.06));
}

export function captionAt(p: number): -1 | 0 | 1 | 2 {
  if (stageAt(p) !== 'turn') return -1;
  return Math.min(2, Math.floor(seg(p, BOUNDS.grail, BOUNDS.turn) * 3)) as 0 | 1 | 2;
}

export function ruleStyle(p: number): { opacity: number; fill: number } {
  return {
    opacity: seg(p, BOUNDS.grail, BOUNDS.grail + 0.03) * (1 - seg(p, BOUNDS.turn, BOUNDS.turn + 0.04)),
    fill: seg(p, BOUNDS.grail, BOUNDS.turn),
  };
}

export function doorsStyle(p: number) {
  const title = seg(p, 0.8, 0.92);
  return {
    titleOpacity: title,
    titleY: lerp(40, 0, title),
    showdownOpacity: seg(p, 0.78, 0.9),
    showdownX: lerp(120, 0, easeInOut(seg(p, 0.78, 0.95))),
    doorCardOpacity: seg(p, HANDOFF, 1),
  };
}

/** 0–1 emission strength: a light dusting at rest, peaking while the card is edge-on and turning fast. */
export function glitterRate(p: number): number {
  switch (stageAt(p)) {
    case 'welcome': return 0;
    case 'toGrail': return 0.15 * seg(p, BOUNDS.welcome, BOUNDS.toGrail);
    case 'grail': return 0.15;
    case 'turn': {
      const t = seg(p, BOUNDS.grail, BOUNDS.turn);
      const speed = 1 - Math.abs(2 * t - 1); // easeInOut turns fastest mid-way
      const edge = Math.abs(Math.sin(rad(spinAngle(p))));
      return 0.15 + 0.85 * edge * (0.4 + 0.6 * speed);
    }
    default: return lerp(0.15, 0.05, seg(p, BOUNDS.turn, 1));
  }
}

const MESH_TURN: MeshShape = { open: 0.42, height: 1300, amp: 2.2, horizon: 0.5 };
const MESH_DOORS: MeshShape = { open: 0.62, height: 1100, amp: 1.2, horizon: 0.62 };

export function meshShape(p: number): MeshShape {
  const into = Math.sin(Math.PI * seg(p, BOUNDS.grail, BOUNDS.turn)); // 0 → 1 → 0 across the turn
  const out = easeInOut(seg(p, BOUNDS.turn, 1));
  const mix = (k: keyof MeshShape) => lerp(lerp(MESH_DEFAULT[k], MESH_TURN[k], into), MESH_DOORS[k], out);
  return { open: mix('open'), height: mix('height'), amp: mix('amp'), horizon: mix('horizon') };
}

/** Strength of the gold light the card casts on nearby mesh dots. */
export function meshLightStrength(p: number): number {
  switch (stageAt(p)) {
    case 'welcome': return 0;
    case 'toGrail': return 0.5 * seg(p, BOUNDS.welcome, BOUNDS.toGrail);
    case 'grail': return 0.5;
    case 'turn': return 0.5 + 0.5 * Math.sin(Math.PI * seg(p, BOUNDS.grail, BOUNDS.turn));
    default: return lerp(0.5, 0.6, seg(p, BOUNDS.turn, 1));
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/grail/sequence.test.ts`
Expected: PASS (all 12 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/grail/sequence.ts lib/grail/sequence.test.ts lib/grail/mesh.ts
git commit -m "feat(grail): add scroll choreography for the grail sequence

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Mesh projection (`lib/grail/mesh.ts`)

**Files:**
- Modify: `lib/grail/mesh.ts` (append below the Task 2 exports)
- Create: `lib/grail/mesh.test.ts`

**Interfaces:**
- Consumes: `MeshShape`, `MESH_DEFAULT` (already in the file).
- Produces:
  - `interface MeshLight { x: number; y: number; r: number; strength: number }`
  - `interface MeshPoint { x: number; y: number; alpha: number; lit: number }`
  - `GRID = { cols: 56, rows: 40 }`
  - `projectGrid(shape: MeshShape, timeSec: number, w: number, h: number, light?: MeshLight | null): MeshPoint[][]`, indexed `[row][col]`, with rows running near to far

- [ ] **Step 1: Write the failing tests** `lib/grail/mesh.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { GRID, MESH_DEFAULT, projectGrid } from './mesh';

const grid = (t = 0, light = null as Parameters<typeof projectGrid>[4]) => projectGrid(MESH_DEFAULT, t, 1440, 900, light);

describe('projectGrid', () => {
  it('returns rows × cols points', () => {
    const g = grid();
    expect(g).toHaveLength(GRID.rows);
    g.forEach(row => expect(row).toHaveLength(GRID.cols));
  });
  it('fades the centre to black so the card has empty space', () => {
    const g = grid();
    const mid = Math.floor(GRID.cols / 2);
    for (const row of g) {
      expect(row[mid].alpha).toBe(0);
      expect(row[mid - 1].alpha).toBe(0);
    }
  });
  it('fades out with depth along an outer column', () => {
    const g = grid();
    const alphas = g.map(row => row[2].alpha);
    alphas.slice(1).forEach((a, i) => expect(a).toBeLessThanOrEqual(alphas[i]));
    expect(alphas[0]).toBeGreaterThan(0.5);
    expect(alphas[GRID.rows - 1]).toBeLessThan(0.05);
  });
  it('drifts over time', () => {
    expect(grid(0)[5][3].y).not.toBeCloseTo(grid(3)[5][3].y, 3);
    expect(grid(2)[5][3]).toEqual(grid(2)[5][3]);
  });
  it('only lights dots near the gold light', () => {
    expect(grid().flat().every(p => p.lit === 0)).toBe(true);
    const near = grid(0)[4][3];
    const lit = grid(0, { x: near.x, y: near.y, r: 200, strength: 0.8 });
    expect(lit[4][3].lit).toBeCloseTo(0.8);
    expect(lit[4][GRID.cols - 4].lit).toBe(0); // the far wall is out of range
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/grail/mesh.test.ts`
Expected: FAIL with `GRID` / `projectGrid` not exported.

- [ ] **Step 3: Append the projection to `lib/grail/mesh.ts`**

```ts
export interface MeshLight { x: number; y: number; r: number; strength: number }
export interface MeshPoint { x: number; y: number; alpha: number; lit: number }

export const GRID = { cols: 56, rows: 40 } as const;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Perspective-projects the wave grid onto a w×h canvas: two walls that rise toward the left and right
 * edges and fade to black in the centre. Rows run near → far. Tuned at 1440×900 (focal 900, camera
 * height 260); lengths scale with the canvas so phones get narrower walls.
 */
export function projectGrid(shape: MeshShape, timeSec: number, w: number, h: number, light: MeshLight | null = null): MeshPoint[][] {
  const k = h / 900;
  const halfWidth = 2100 * (w / 1440);
  const horizon = shape.horizon * h;
  const phase = timeSec * 0.15;
  const rows: MeshPoint[][] = [];
  for (let r = 0; r < GRID.rows; r++) {
    const v = r / (GRID.rows - 1);
    const z = 220 + v * 2200;
    const depthFade = (1 - v) ** 0.8;
    const row: MeshPoint[] = [];
    for (let c = 0; c < GRID.cols; c++) {
      const u = (c / (GRID.cols - 1)) * 2 - 1;
      const side = Math.abs(u);
      const wall = Math.max(0, (side - shape.open) / (1 - shape.open)) ** 1.6;
      const wave =
        Math.sin(u * 5.1 + v * 7.3 + phase) * 0.5 +
        Math.sin(u * 2.3 - v * 11 + 1.7 + phase * 0.7) * 0.35 +
        Math.cos(v * 4 + u * 9 - phase * 0.5) * 0.25;
      const y = (wall * shape.height + wave * (40 + wall * 120) * shape.amp) * k;
      const x = w / 2 + (u * halfWidth * 900) / z;
      const sy = horizon + ((260 * k - y) * 900) / z;
      const alpha = depthFade * clamp01((side - shape.open * 0.7) / 0.3);
      const lit = light ? clamp01(1 - Math.hypot(x - light.x, sy - light.y) / light.r) * light.strength : 0;
      row.push({ x, y: sy, alpha, lit });
    }
    rows.push(row);
  }
  return rows;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/grail/mesh.test.ts lib/grail/sequence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/grail/mesh.ts lib/grail/mesh.test.ts
git commit -m "feat(grail): project the indigo mesh walls

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Particles, shared store, and text helpers

**Files:**
- Create: `lib/grail/particles.ts`, `lib/grail/particles.test.ts`, `lib/grail/store.ts`, `lib/grail/store.test.ts`, `lib/grail/format.ts`, `lib/grail/format.test.ts`

**Interfaces:**
- Consumes: `MESH_DEFAULT`, `MeshShape`, `MeshLight` from `./mesh`.
- Produces:
  - `GOLDS`: `readonly ['255,226,150', '217,180,90', '255,241,184', '196,150,60']`
  - `interface Emitter { x: number; y: number; w: number; h: number; dir: 1 | -1 }`
  - `interface Particle { x; y; vx; vy; age; life; size; alpha: number; color: number; mote: boolean }`
  - `emit(pool: Particle[], count: number, e: Emitter, cap: number, rand?: () => number): void`
  - `step(pool: Particle[], dt: number): void`
  - `emissionCount(rate: number, dt: number, perSecond: number, carry: number): { count: number; carry: number }`
  - `grailStore: { mesh: MeshShape; light: MeshLight | null; glitter: { rate: number; emitter: Emitter | null } }`
  - `resetGrailStore(): void`
  - `formatUpdated(updatedAt: string | null): string | null`
  - `priceCaption(price: string | null): string`

- [ ] **Step 1: Write the failing tests**

`lib/grail/particles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GOLDS, emissionCount, emit, step, type Emitter, type Particle } from './particles';

/** Deterministic random numbers so the tests never flake. */
const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const card: Emitter = { x: 500, y: 400, w: 300, h: 420, dir: -1 };

describe('emit', () => {
  it('never exceeds the cap', () => {
    const pool: Particle[] = [];
    emit(pool, 80, card, 50, seeded());
    expect(pool).toHaveLength(50);
    emit(pool, 10, card, 50, seeded(2));
    expect(pool).toHaveLength(50);
  });
  it('makes round gold dust with about 7% larger motes', () => {
    const pool: Particle[] = [];
    emit(pool, 2000, card, 2000, seeded(3));
    const motes = pool.filter(p => p.mote).length / pool.length;
    expect(motes).toBeGreaterThan(0.04);
    expect(motes).toBeLessThan(0.1);
    for (const p of pool) {
      expect(p.color).toBeGreaterThanOrEqual(0);
      expect(p.color).toBeLessThan(GOLDS.length);
      expect(p.size).toBeLessThanOrEqual(p.mote ? 8 : 2.9);
    }
  });
  it('starts at the card edges and drifts opposite the turn', () => {
    const pool: Particle[] = [];
    emit(pool, 500, card, 500, seeded(4));
    for (const p of pool) expect(Math.abs(p.x - card.x)).toBeGreaterThanOrEqual(card.w * 0.4 - 1e-9);
    expect(pool.filter(p => p.vx < 0).length / pool.length).toBeGreaterThan(0.95);
  });
});

describe('step', () => {
  it('moves particles and removes them when their life is over', () => {
    const pool: Particle[] = [];
    emit(pool, 100, card, 100, seeded(5));
    const before = pool[0].x;
    step(pool, 0.1);
    expect(pool[0].x).not.toBe(before);
    for (let i = 0; i < 20; i++) step(pool, 0.1); // 2.1s > max life 1.4s
    expect(pool).toHaveLength(0);
  });
});

describe('emissionCount', () => {
  it('carries fractional particles between frames', () => {
    let carry = 0;
    let total = 0;
    // 0.25 × 8/s × 0.125s = a quarter particle per frame (exact in binary, so no rounding drift)
    for (let i = 0; i < 40; i++) {
      const r = emissionCount(0.25, 0.125, 8, carry);
      carry = r.carry;
      total += r.count;
    }
    expect(total).toBe(10);
  });
});
```

`lib/grail/store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MESH_DEFAULT } from './mesh';
import { grailStore, resetGrailStore } from './store';

describe('resetGrailStore', () => {
  it('returns the mesh to its default and stops the glitter', () => {
    Object.assign(grailStore.mesh, { open: 0.62, height: 1100 });
    grailStore.light = { x: 1, y: 2, r: 3, strength: 1 };
    grailStore.glitter.rate = 0.9;
    grailStore.glitter.emitter = { x: 0, y: 0, w: 1, h: 1, dir: 1 };
    resetGrailStore();
    expect(grailStore.mesh).toEqual(MESH_DEFAULT);
    expect(grailStore.light).toBeNull();
    expect(grailStore.glitter).toEqual({ rate: 0, emitter: null });
  });
  it('never hands out the shared default object itself', () => {
    resetGrailStore();
    expect(grailStore.mesh).not.toBe(MESH_DEFAULT);
  });
});
```

`lib/grail/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatUpdated, priceCaption } from './format';

describe('formatUpdated', () => {
  it('turns the API date into a short label', () => {
    expect(formatUpdated('2026/10/09')).toBe('Oct 9, 2026');
  });
  it('returns null for missing or broken dates', () => {
    expect(formatUpdated(null)).toBeNull();
    expect(formatUpdated('soon')).toBeNull();
  });
});

describe('priceCaption', () => {
  it('falls back to "Unpriced" when there is no price', () => {
    expect(priceCaption('$2,501')).toBe('$2,501');
    expect(priceCaption(null)).toBe('Unpriced');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run lib/grail/particles.test.ts lib/grail/store.test.ts lib/grail/format.test.ts`
Expected: FAIL. The modules don't exist yet.

- [ ] **Step 3: Implement the three modules**

`lib/grail/particles.ts`:

```ts
/** Gold dust around the spinning card. Pure: GlitterCanvas owns the canvas and the clock. */
export const GOLDS = ['255,226,150', '217,180,90', '255,241,184', '196,150,60'] as const;

/** Where particles spawn: the card's on-screen box. dir = horizontal drift (opposite the turn). */
export interface Emitter { x: number; y: number; w: number; h: number; dir: 1 | -1 }

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  age: number; life: number;
  /** Core radius in px (dust 0.5–2.9, motes 3–8). */
  size: number;
  alpha: number;
  /** Index into GOLDS. */
  color: number;
  /** A larger, soft, out-of-focus speck for depth. */
  mote: boolean;
}

const MOTE_SHARE = 0.07;

export function emit(pool: Particle[], count: number, e: Emitter, cap: number, rand: () => number = Math.random): void {
  const n = Math.min(count, cap - pool.length);
  for (let i = 0; i < n; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    const mote = rand() < MOTE_SHARE;
    const angle = (e.dir > 0 ? 0 : Math.PI) + (rand() - 0.5) * 1.4;
    const speed = 40 + rand() * 180;
    pool.push({
      x: e.x + side * (e.w / 2) * (0.8 + rand() * 0.4),
      y: e.y + (rand() - 0.5) * e.h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30, // a slight upward drift
      age: 0,
      life: 0.6 + rand() * 0.8,
      size: mote ? 3 + rand() * 5 : 0.5 + rand() ** 2 * 2.4,
      alpha: 0.3 + rand() * 0.7,
      color: Math.floor(rand() * GOLDS.length),
      mote,
    });
  }
}

export function step(pool: Particle[], dt: number): void {
  const drag = 0.35 ** dt;
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.age += dt;
    if (p.age >= p.life) {
      pool[i] = pool[pool.length - 1];
      pool.pop();
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= drag;
    p.vy *= drag;
  }
}

/** Whole particles to spawn this frame; the fraction carries to the next frame. */
export function emissionCount(rate: number, dt: number, perSecond: number, carry: number): { count: number; carry: number } {
  const exact = rate * perSecond * dt + carry;
  const count = Math.floor(exact);
  return { count, carry: exact - count };
}
```

`lib/grail/store.ts`:

```ts
import { MESH_DEFAULT, type MeshLight, type MeshShape } from './mesh';
import type { Emitter } from './particles';

/**
 * Per-frame state written by GrailSequence and read by MeshBackground and GlitterCanvas in their
 * animation loops. A plain mutable object on purpose: it changes every frame and must not re-render React.
 */
export const grailStore = {
  mesh: { ...MESH_DEFAULT } as MeshShape,
  light: null as MeshLight | null,
  glitter: { rate: 0, emitter: null as Emitter | null },
};

/** Called when the home sequence unmounts, so other pages get the resting mesh and no glitter. */
export function resetGrailStore(): void {
  Object.assign(grailStore.mesh, MESH_DEFAULT);
  grailStore.light = null;
  grailStore.glitter.rate = 0;
  grailStore.glitter.emitter = null;
}
```

`lib/grail/format.ts`:

```ts
/** "2026/10/09" (Pokémon TCG API) → "Oct 9, 2026". */
export function formatUpdated(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  const date = new Date(`${updatedAt.replace(/\//g, '-')}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export const priceCaption = (price: string | null): string => price ?? 'Unpriced';
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/grail`
Expected: PASS (all files in `lib/grail`).

- [ ] **Step 5: Commit**

```bash
git add lib/grail/particles.ts lib/grail/particles.test.ts lib/grail/store.ts lib/grail/store.test.ts lib/grail/format.ts lib/grail/format.test.ts
git commit -m "feat(grail): add gold-dust particles, shared frame store, and text helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Site foundation: fonts, tokens, utilities, mesh background

**Files:**
- Create: `components/grail/MeshBackground.tsx`, `app/cards/layout.tsx`
- Modify: `app/layout.tsx`, `app/globals.css:3-16` (theme) plus new utilities, `components/motion/SmoothScroll.tsx`, `e2e/manga.spec.ts` (drop the Dela/Zen Kaku and CJK-preload tests)
- Delete: `components/motion/MarbleBackground.tsx`, `lib/parallax.ts`, `lib/parallax.test.ts`, `public/marble.webp`, `public/marble-sm.webp`

**Interfaces:**
- Consumes: `projectGrid`, `GRID` from `@/lib/grail/mesh`; `grailStore` from `@/lib/grail/store`.
- Produces:
  - CSS tokens `--color-red`, `--color-indigo`, `--color-indigo-deep`, giving Tailwind classes `text-red`, `text-indigo`, `border-red`, `bg-ink`
  - Global classes `.meta`, `.copy`, `.text-link`, `.grain`
  - `scrollToY(y: number, immediate?: boolean): void` from `@/components/motion/SmoothScroll`
  - `<MeshBackground />`

- [ ] **Step 1: Swap fonts and the background in `app/layout.tsx`**

Replace the whole file with:

```tsx
import type { Metadata } from 'next';
import { Anton, JetBrains_Mono, Press_Start_2P } from 'next/font/google';
import { MeshBackground } from '@/components/grail/MeshBackground';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });

export const metadata: Metadata = {
  title: 'Pokémon Vault',
  description: 'Rare Pokémon cards ranked by rarity with estimated prices, and a stat-driven Pokémon Showdown.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${mono.variable} ${pixel.variable}`}>
      {/* No body background: the html element paints ink, so the fixed mesh canvas (z -10) shows through. */}
      <body className="min-h-screen text-cream antialiased">
        <MeshBackground />
        <SmoothScroll>
          <SiteNav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Keep the ink filter on the Vault pages** with a new `app/cards/layout.tsx`

```tsx
import { InkDefs } from '@/components/manga/InkDefs';

// The Vault pages still use manga InkPanels (restyled in a later pass); they need the #ink-rough filter.
export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InkDefs />
      {children}
    </>
  );
}
```

- [ ] **Step 3: Update the theme and add text utilities in `app/globals.css`**

Replace the `@theme { … }` block (lines 3–16) with:

```css
@theme {
  --color-ink: #050507;
  --color-surface: #141414;
  --color-line: #2a2418;
  --color-gold: #d4af37;
  --color-gold-light: #f5d77a;
  --color-gold-dark: #8c6b1f;
  --color-cream: #ede6d6;
  --color-muted: #8a8375;
  --color-red: #ff2b2b;
  --color-indigo: #6e6bff;
  --color-indigo-deep: #4a4dff;
  --font-display: var(--font-anton), 'Arial Narrow', sans-serif;
  --font-sans: var(--font-jetbrains), ui-monospace, monospace;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
  --font-pixel: var(--font-press-start), monospace;
}
```

Change the `::selection` rule to `::selection { background: var(--color-red); color: var(--color-ink); }`.

Then add this block directly after the `.border-gold-frame { … }` rule:

```css
/* ---------- Editorial ---------- */
@layer components {
  /* Small uppercase mono for nav, meta lines and labels. */
  .meta { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
  /* Mono paragraph copy. */
  .copy { font-family: var(--font-mono); font-size: 10.5px; line-height: 1.75; letter-spacing: 0.08em; text-transform: uppercase; }
  /* Calls to action: an underlined indigo line of mono, never a pill button. */
  .text-link {
    display: inline-block; padding-bottom: 6px; border-bottom: 1px solid currentColor;
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-indigo); transition: color 0.2s;
  }
  .text-link:hover { color: var(--color-red); }
  /* Print grain on giant headlines. The mask clips to the element box, so give accents top padding. */
  .grain {
    -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
}
```

- [ ] **Step 4: Expose a Lenis-aware scroll helper in `components/motion/SmoothScroll.tsx`**

Replace the file with:

```tsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

let lenis: Lenis | null = null;

/** Scroll the page, through Lenis when it is running so the two never fight. */
export function scrollToY(y: number, immediate = false): void {
  if (lenis) lenis.scrollTo(y, { immediate });
  else window.scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const instance = new Lenis({ lerp: 0.1 });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);
  return <>{children}</>;
}
```

- [ ] **Step 5: Add `components/grail/MeshBackground.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { GRID, projectGrid, type MeshPoint } from '@/lib/grail/mesh';
import { grailStore } from '@/lib/grail/store';

const FRAME_MS = 1000 / 30;
const BUCKETS = 10;

/** Fixed indigo wire-mesh walls on both sides of every page. Pages shape it through grailStore. */
export function MeshBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = -Infinity;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (timeMs: number) => {
      const mobile = w < 768;
      const shape = mobile ? { ...grailStore.mesh, open: Math.max(grailStore.mesh.open, 0.55) } : grailStore.mesh;
      const grid = projectGrid(shape, timeMs / 1000, w, h, grailStore.light);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = mobile ? 0.6 : 1;

      // Lines batched by alpha bucket: ~10 strokes per frame instead of ~4,400.
      const paths = Array.from({ length: BUCKETS }, () => new Path2D());
      const add = (a: MeshPoint, b: MeshPoint) => {
        const alpha = Math.min(a.alpha, b.alpha);
        if (alpha < 0.02) return;
        const path = paths[Math.min(BUCKETS - 1, Math.floor(alpha * BUCKETS))];
        path.moveTo(a.x, a.y);
        path.lineTo(b.x, b.y);
      };
      for (let r = 0; r < GRID.rows; r++) {
        for (let c = 0; c < GRID.cols; c++) {
          if (c < GRID.cols - 1) add(grid[r][c], grid[r][c + 1]);
          if (r < GRID.rows - 1) add(grid[r][c], grid[r + 1][c]);
        }
      }
      ctx.lineWidth = 0.9;
      paths.forEach((path, i) => {
        ctx.strokeStyle = `rgba(74, 77, 255, ${Math.min(1, ((i + 0.5) / BUCKETS) * 1.1)})`;
        ctx.stroke(path);
      });

      for (const row of grid) {
        for (const p of row) {
          if (p.alpha < 0.05) continue;
          ctx.fillStyle = p.lit > 0.15
            ? `rgba(255, 226, 150, ${Math.min(1, p.alpha * 0.9 + p.lit)})`
            : `rgba(124, 120, 255, ${Math.min(1, p.alpha * 1.2)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3 + p.alpha * 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      draw(t);
    };
    const start = () => { cancelAnimationFrame(raf); if (!reduce && !document.hidden) raf = requestAnimationFrame(loop); };
    const onResize = () => { resize(); if (reduce) draw(0); };

    resize();
    if (reduce) draw(0);
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', start);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 size-full" />;
}
```

- [ ] **Step 6: Delete the marble layer and the manga font tests**

```bash
git rm components/motion/MarbleBackground.tsx lib/parallax.ts lib/parallax.test.ts public/marble.webp public/marble-sm.webp
```

In `e2e/manga.spec.ts`, delete these whole tests:
- `'headings use Dela Gothic One and body uses Zen Kaku Gothic New'` (the first test)
- `'does not preload every CJK font slice'`

- [ ] **Step 7: Verify**

Run: `npm run lint && npm test && npm run build`
Expected: all pass. The build lists `/`, `/cards`, `/cards/[id]` and `/showdown` with no type errors.

Then run `npm run dev`. On `http://localhost:3000/cards`, the indigo mesh walls show at the sides, headings are in Anton, and the ink panels still have rough borders.

- [ ] **Step 8: Commit**

```bash
git add -A app/layout.tsx app/globals.css app/cards/layout.tsx components/grail/MeshBackground.tsx components/motion/SmoothScroll.tsx e2e/manga.spec.ts
git commit -m "feat(ui): switch to Anton and JetBrains Mono with indigo mesh background

Replaces the marble layer and the Dela/Zen Kaku fonts. The Vault pages
keep their ink filter through a cards layout until their own redesign.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Nav, page curtain, and 404

**Files:**
- Modify: `components/SiteNav.tsx`, `app/template.tsx:10`, `app/not-found.tsx`

**Interfaces:**
- Consumes: `.meta`, `.copy`, `.text-link`, `text-red`, `text-indigo` (Task 5).
- Produces: a nav with `aria-current="page"` on the active link.

- [ ] **Step 1: Write the failing e2e test**: append to `e2e/smoke.spec.ts`

```ts
test('nav marks the current page', async ({ page }) => {
  await page.goto('/cards');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Vault', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'The Grail' })).not.toHaveAttribute('aria-current', 'page');
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test e2e/smoke.spec.ts -g "nav marks"`
Expected: FAIL. No navigation is named "Main".

- [ ] **Step 3: Rewrite `components/SiteNav.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'The Grail' },
  { href: '/cards', label: 'Vault' },
  { href: '/showdown', label: 'Showdown' },
] as const;

export function SiteNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-linear-to-b from-ink/90 to-transparent px-4 py-5 md:px-12">
      <Link href="/" className="whitespace-nowrap font-display text-lg uppercase tracking-wide text-red md:text-[22px]">
        Pokémon Vault
      </Link>
      <nav aria-label="Main" className="meta flex gap-5 whitespace-nowrap md:gap-11">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            className={isActive(link.href) ? 'text-red underline underline-offset-[6px]' : 'text-indigo transition hover:text-red'}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Change the curtain colour in `app/template.tsx`**

Replace the first `motion.div`'s `className` with:

```tsx
className="pointer-events-none fixed inset-0 z-[90] origin-top border-b border-red bg-ink motion-reduce:hidden"
```

- [ ] **Step 5: Rewrite `app/not-found.tsx`**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center text-indigo">
      <div>
        <p className="meta">Error 404</p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] text-red sm:text-8xl md:text-[10rem]">A wild MissingNo.</h1>
        <p className="copy mx-auto mt-6 max-w-sm">This page fled. It isn’t in the vault.</p>
        <Link href="/" className="text-link mt-10">Back to the vault →</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Run the nav and 404 tests**

Run: `npx playwright test e2e/smoke.spec.ts -g "nav marks|unknown card"`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add components/SiteNav.tsx app/template.tsx app/not-found.tsx e2e/smoke.spec.ts
git commit -m "feat(ui): restyle nav, page curtain, and 404 in the editorial type

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Home page, static layout (welcome, grail, doors)

This task builds the server-rendered layout that no-JS and reduced-motion users see. It also deletes the manga home. Task 8 adds the pinned sequence on top.

**Files:**
- Create: `components/grail/GrailCard.tsx`, `components/grail/ShowdownDevice.tsx`, `components/grail/Doors.tsx`, `components/grail/GlitterCanvas.tsx` (stub in this task), `components/grail/GrailSequence.tsx`, `components/grail/grail.module.css`, `e2e/home.spec.ts`
- Modify: `app/page.tsx`, `lib/manga/decor.ts:4`, `lib/manga/decor.test.ts`, `lib/manga/decor-manifest.json`, `scripts/compress-decor.ts:12-14`, `e2e/smoke.spec.ts` (first test), `e2e/manga.spec.ts` (home tests)
- Delete: `components/home/Hero.tsx`, `components/home/Chapter.tsx`, `components/home/FeaturePanels.tsx`, `components/motion/GoldParticles.tsx`, `public/decor/hero-hand.webp`, `public/decor/vault-door.webp`, `public/decor/arena.webp`

**Interfaces:**
- Consumes: `GRAIL` (Task 1), `GRAIL_FACES` (Task 1), `formatUpdated` and `priceCaption` (Task 4), `formatPrice` from `@/lib/tcg/normalize`, `getCard` from `@/lib/tcg/client`, `TIER_ORDER` from `@/data/rarity`, `SHOWCASE` from `@/data/showcase`.
- Produces: the DOM contract Task 8 drives. These selectors must exist exactly:
  - `[data-part="welcome" | "headline" | "grailMeta" | "grailCopy" | "price" | "grailLabel" | "rule" | "ruleFill" | "doors" | "doorsTitle"]`
  - `[data-caption="0|1|2"]`
  - `[data-grail-card]` (the 3D card) inside `[data-card-home]` (its untransformed box)
  - `[data-door="vault" | "showdown"]` (the links)
  - `[data-door-card]` (the Vault door's untransformed 270×370 box) containing `[data-vault-card]`
  - `[data-goto]` on in-section links
  - `[data-glitter]` (the canvas)
  - CSS module classes `styles.root` (gets `data-sequenced`) and `styles.stage` (pinned)
  - `GrailSequence` props: `{ price: string | null; priceSource: string | null; updatedAt: string | null; tierCount: number; cardCount: number }`

- [ ] **Step 1: Write the failing e2e tests** in a new `e2e/home.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('home opens on the site name and description', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Pokémon Vault');
  await expect(page.getByText(/A vault of rare Pokémon cards, from Base Set holos to Gold Stars\./)).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Rayquaza' })).toBeAttached();
});

test('headlines use Anton and copy uses JetBrains Mono', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily)).toMatch(/Anton/);
  expect(await page.locator('[data-part="welcome"] .copy').evaluate(el => getComputedStyle(el).fontFamily)).toMatch(/JetBrains Mono/);
});

test('card faces load and nothing overflows at 375px', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', r => { if (r.url().includes('grail') && r.status() >= 400) failed.push(r.url()); });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(failed).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows welcome, grail, and both doors as plain stacked screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-part="welcome"]')).toBeVisible();
    const vault = page.getByRole('link', { name: /Enter the vault/ });
    const showdown = page.getByRole('link', { name: /Enter the arena/ });
    await vault.scrollIntoViewIfNeeded();
    await expect(vault).toBeVisible();
    await expect(showdown).toBeVisible();
    await expect(page.locator('[data-glitter]')).toBeHidden();
    expect(await page.locator('[data-vault-card]').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  });
  test('door links go to the vault and the arena', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the vault/ }).click();
    await expect(page).toHaveURL(/\/cards$/);
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the arena/ }).click();
    await expect(page).toHaveURL(/\/showdown$/);
  });
});
```

Replace the first test in `e2e/smoke.spec.ts` (`'home renders the hero'`) with:

```ts
test('home renders the welcome screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Pokémon Vault');
  await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeAttached();
});
```

In `e2e/manga.spec.ts`, delete these home-page tests:
- `'home hero is a 3-panel manga spread'`
- `'no failed decor requests and no horizontal scroll at 375px'`
- `'home chapter shows five panels'`
- the whole `test.describe('reduced motion', …)` block
- `'after the chapter zoom, nothing overflows or blocks the feature links'`
- `'feature panel links show a visible focus ring inside the panel'`
- the whole `test.describe('short desktop viewport', …)` block
- `'chapter tier list keeps AA-level opacity'`

Keep the Vault, card-detail, headings-fit and cursor tests.

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test e2e/home.spec.ts`
Expected: FAIL. The h1 is still "Rare by design."

- [ ] **Step 3: Add the section stylesheet** `components/grail/grail.module.css`

```css
/*
 * Home "grail" section. Without JS or with reduced motion it is three stacked screens (welcome, grail,
 * doors). GrailSequence sets data-sequenced on .root and pins .stage, layering the screens in one viewport.
 * The welcome and doors layouts are the same in both modes, so turning the sequence on doesn't shift them.
 */
.root { position: relative; color: var(--color-indigo); }
.stage { position: relative; }

.welcome, .grail, .doors {
  position: relative; min-height: 100svh; padding: 112px 48px 56px;
  display: flex; flex-direction: column;
}
.welcome { justify-content: center; z-index: 2; }
.grail { align-items: center; justify-content: center; gap: 28px; z-index: 1; }
.doors { justify-content: center; z-index: 2; }

.root[data-sequenced] .stage { height: 100svh; overflow: hidden; }
.root[data-sequenced] .welcome,
.root[data-sequenced] .grail,
.root[data-sequenced] .doors { position: absolute; inset: 0; min-height: 0; }
.root[data-sequenced] .grail { display: block; pointer-events: none; }
.root[data-sequenced] .grail a { pointer-events: auto; }

/* ---------- shared ---------- */
.metaRow { display: flex; justify-content: space-between; gap: 24px; width: 100%; }
.vlabel { position: absolute; right: 40px; top: 50%; transform: translateY(-50%); writing-mode: vertical-rl; }
.display { font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400; }

/* ---------- welcome ---------- */
.siteName {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: min(clamp(84px, 14.7vw, 216px), 24svh); line-height: 0.86; text-align: center; white-space: nowrap;
  padding-top: 0.16em; margin-top: 8px;
}
.subhead {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: min(clamp(40px, 4.45vw, 64px), 8svh); line-height: 0.95; margin-top: 24px;
}
.intro { max-width: 420px; margin-top: 40px; }
.intro > a { margin-top: 28px; }
.facts { position: absolute; right: 96px; bottom: 60px; text-align: right; line-height: 2; list-style: none; }

/* ---------- grail ---------- */
.cardName {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: clamp(120px, 22vw, 340px); line-height: 0.82; text-align: center; letter-spacing: -0.01em;
  padding-top: 0.08em; transform-origin: 50% 60%;
}
.cardHome {
  --card-w: min(310px, 21.5vw, 34svh);
  position: relative; z-index: 3; width: var(--card-w); aspect-ratio: 1200 / 1645;
  perspective: 1400px; margin-top: calc(min(150px, 10vw) * -1);
}
.grailCopy { width: 300px; align-self: flex-start; }
.kicker {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: 44px; line-height: 0.95; margin-bottom: 22px;
}
.grailCopy > a { margin-top: 26px; }
.price { align-self: flex-end; text-align: right; }
.priceValue { font-family: var(--font-display); font-size: 64px; line-height: 1; margin-top: 10px; }
.captions, .rule, .grail .vlabel { display: none; }

.root[data-sequenced] .grail .metaRow { position: absolute; top: 17svh; left: 48px; right: 48px; width: auto; }
.root[data-sequenced] .cardName { position: absolute; left: 0; right: 0; top: 21svh; z-index: 1; }
.root[data-sequenced] .cardHome { position: absolute; left: 50%; top: 30svh; margin: 0 0 0 calc(var(--card-w) / -2); }
.root[data-sequenced] .grailCopy { position: absolute; left: 48px; bottom: 56px; }
.root[data-sequenced] .price { position: absolute; right: 96px; bottom: 56px; }
.root[data-sequenced] .grail .vlabel { display: block; }
.root[data-sequenced] .captions { display: block; position: absolute; left: 48px; top: 37svh; width: 300px; list-style: none; }
.caption { position: absolute; left: 0; top: 0; width: 100%; opacity: 0; }
.captionTitle {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: 56px; line-height: 0.92; margin: 14px 0 12px;
}
.root[data-sequenced] .rule {
  display: block; position: absolute; left: 48px; right: 48px; bottom: 44px; height: 1px;
  background: rgb(110 107 255 / 0.25); opacity: 0;
}
.ruleFill { height: 100%; background: var(--color-indigo); transform-origin: left; transform: scaleX(0); }

/* ---------- the 3D card ---------- */
.card {
  --t: 5px; --glint: -60%; --glint-o: 0.35;
  position: absolute; inset: 0; transform-style: preserve-3d; will-change: transform;
  transform: rotateX(10deg) rotateZ(-5deg) rotateY(-24deg);
}
.face {
  position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden;
  border-radius: 4.5% / 3.28%;
  box-shadow: 0 40px 90px rgb(0 0 0 / 0.85), 0 0 60px rgb(217 180 90 / 0.18);
}
.front { transform: translateZ(calc(var(--t) / 2)); }
.back { transform: rotateY(180deg) translateZ(calc(var(--t) / 2)); }
.face::after {
  content: ''; position: absolute; inset: -20%; pointer-events: none; mix-blend-mode: screen;
  background: linear-gradient(105deg, transparent 38%, rgb(255 246 214 / 0.55) 48%, rgb(255 214 120 / 0.18) 53%, transparent 62%);
  transform: translateX(var(--glint)); opacity: var(--glint-o);
}
/* Gold edges: visible only while the card is edge-on. */
.edge {
  position: absolute; top: 3.3%; bottom: 3.3%; width: var(--t);
  background: linear-gradient(180deg, #8a6a22, #f6dc8a 30%, #d9b45a 55%, #fff1b8 70%, #8a6a22);
}
.edgeL { left: calc(var(--t) / -2); transform: rotateY(90deg); }
.edgeR { right: calc(var(--t) / -2); transform: rotateY(90deg); }

.glitter { display: none; position: absolute; inset: 0; z-index: 4; width: 100%; height: 100%; pointer-events: none; }
.root[data-sequenced] .glitter { display: block; }

/* ---------- doors ---------- */
.doorsLayout { display: grid; grid-template-columns: minmax(0, 400px) 1fr; align-items: center; gap: 40px; }
.chooseTitle {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: clamp(64px, 7.2vw, 104px); line-height: 0.86; margin: 22px 0 30px;
}
.doorRow { display: flex; gap: 80px; justify-content: center; }
.door { --door-w: 270px; --door-scale: 1; display: block; width: var(--door-w); color: inherit; }
.door:focus-visible { outline: 2px solid var(--color-indigo); outline-offset: 6px; }
.doorObj {
  position: relative; width: var(--door-w); height: calc(var(--door-w) * 370 / 270); margin-bottom: 26px;
  transition: transform 0.3s;
}
.door:hover .doorObj { transform: translateY(-6px); }
/* Both door objects are drawn at 270×370 and scaled, so the Game Boy's pixel layout never reflows. */
.doorScale {
  position: absolute; left: 0; top: 0; width: 270px; height: 370px; perspective: 1400px;
  transform-origin: top left; transform: scale(var(--door-scale));
}
.vaultCard {
  position: absolute; inset: 0; overflow: hidden; border-radius: 4.5% / 3.28%;
  transform: rotateZ(-2deg) rotateY(14deg); /* = DOOR_TILT in lib/grail/sequence.ts */
  box-shadow: 0 30px 70px rgb(0 0 0 / 0.85), 0 0 70px rgb(217 180 90 / 0.3);
}
.root[data-sequenced] .vaultCard { opacity: 0; }
.doorWord {
  font-family: var(--font-display); color: var(--color-red); text-transform: uppercase; font-weight: 400;
  font-size: 58px; line-height: 0.9; margin: 10px 0 14px; transition: color 0.2s;
}
.door:hover .doorWord { color: transparent; -webkit-text-stroke: 1.5px var(--color-red); }

/* ---------- Showdown door: mini Game Boy ---------- */
.gb {
  position: absolute; inset: 0; border-radius: 16px; padding: 16px 16px 0;
  background: linear-gradient(160deg, #0a56c9, #0047ab 40%, #002e7a);
  box-shadow: 0 30px 70px rgb(0 0 0 / 0.8), inset 0 0 0 1px rgb(255 255 255 / 0.08);
  transform: rotateZ(2deg) rotateY(-14deg);
}
.screen {
  position: relative; height: 262px; overflow: hidden; border: 3px solid #141414; border-radius: 6px;
  background: #f6f6f2; color: #141414; font-family: var(--font-pixel); font-size: 7px;
}
.hp { position: absolute; width: 110px; padding: 5px 6px; border: 2px solid #141414; border-radius: 2px; background: #fff; }
.bar { height: 5px; margin-top: 5px; overflow: hidden; border: 1.5px solid #141414; border-radius: 3px; }
.bar > i { display: block; height: 100%; background: #20b04b; }
.plat { position: absolute; width: 96px; height: 22px; border-radius: 50%; background: #e3e3d8; border: 2px solid #c9c9bc; }
.balls { position: absolute; display: flex; gap: 4px; }
.balls > b { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid #141414; background: #fff; opacity: 0.5; }
.textBox {
  position: absolute; left: 6px; right: 6px; bottom: 6px; height: 62px; padding: 9px 10px; line-height: 1.9;
  border: 3px double #141414; border-radius: 4px; background: #fff;
}
.menu { position: absolute; right: 10px; top: 9px; }
.base { height: 76px; display: flex; align-items: center; justify-content: space-between; padding: 0 6px; }
.gbLogo { font-family: var(--font-pixel); font-size: 9px; letter-spacing: 0.08em; color: #fff; }
.btns { display: flex; gap: 10px; }
.btns > span { width: 26px; height: 26px; border-radius: 50%; background: #c8102e; box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.3); }

/* ---------- short desktop screens ---------- */
@media (min-width: 768px) and (max-height: 760px) {
  .welcome, .grail, .doors { padding-top: 88px; padding-bottom: 40px; }
  .intro { margin-top: 24px; }
  .door { --door-w: 200px; --door-scale: 0.7407; }
  .doorWord { font-size: 44px; }
  .chooseTitle { font-size: 72px; }
}

/* ---------- phones ---------- */
@media (max-width: 767px) {
  .welcome, .grail, .doors { padding: 96px 20px 40px; }
  .siteName { font-size: 26vw; white-space: normal; text-align: left; }
  .subhead { font-size: 11vw; }
  .facts { position: static; text-align: left; margin-top: 28px; }
  .vlabel, .root[data-sequenced] .grail .vlabel { display: none; }
  .metaRow > :last-child { display: none; }
  .cardName { font-size: 24vw; }
  .cardHome { --card-w: min(62vw, 36svh); }
  .grailCopy { width: 100%; }
  .kicker { font-size: 30px; margin-bottom: 12px; }
  .priceValue { font-size: 40px; }
  .doorsLayout { grid-template-columns: 1fr; gap: 24px; }
  .chooseTitle { font-size: 56px; margin: 12px 0 0; }
  .doorRow { gap: 16px; justify-content: flex-start; }
  .door { --door-w: 160px; --door-scale: 0.5926; }
  .doorObj { margin-bottom: 14px; }
  .doorWord { font-size: 34px; }

  .root[data-sequenced] .grail .metaRow { top: 84px; left: 20px; right: 20px; }
  .root[data-sequenced] .cardName { top: 110px; }
  .root[data-sequenced] .cardHome { top: calc(110px + 12vw); }
  .root[data-sequenced] .grailCopy { left: 20px; right: 20px; bottom: 32px; width: auto; }
  .root[data-sequenced] .grailCopy .copy { display: none; }
  .root[data-sequenced] .price { right: 20px; bottom: auto; top: 104px; }
  .root[data-sequenced] .captions { left: 20px; top: auto; bottom: 48px; width: calc(100% - 40px); height: 130px; }
  .captionTitle { font-size: 36px; }
  .root[data-sequenced] .rule { left: 20px; right: 20px; bottom: 24px; }
}
```

- [ ] **Step 4: Add the card, the Game Boy, the doors and the glitter stub**

`components/grail/GrailCard.tsx`:

```tsx
import Image from 'next/image';
import { GRAIL_FACES } from '@/lib/grail/assets';
import styles from './grail.module.css';

const SIZES = '(min-width: 768px) 310px, 62vw';

/** The grail card in CSS 3D. Decorative: the section's text carries the name, set and price. */
export function GrailCard() {
  return (
    <div className={styles.card} data-grail-card aria-hidden>
      <div className={`${styles.edge} ${styles.edgeL}`} />
      <div className={`${styles.edge} ${styles.edgeR}`} />
      <div className={`${styles.face} ${styles.front}`}>
        <Image src={GRAIL_FACES.front} alt="" fill sizes={SIZES} loading="eager" />
      </div>
      <div className={`${styles.face} ${styles.back}`}>
        <Image src={GRAIL_FACES.back} alt="" fill sizes={SIZES} loading="eager" fetchPriority="low" />
      </div>
    </div>
  );
}
```

`components/grail/ShowdownDevice.tsx`:

```tsx
import styles from './grail.module.css';

const emptySlots = Array.from({ length: 6 }, (_, i) => <b key={i} />);

/** A card-sized Game Boy with an empty battle screen: a preview of the Showdown page. Decorative. */
export function ShowdownDevice() {
  return (
    <div className={styles.gb} aria-hidden>
      <div className={styles.screen}>
        <div className={styles.hp} style={{ left: 10, top: 12 }}>RIVAL<div className={styles.bar}><i style={{ width: '100%' }} /></div></div>
        <div className={styles.balls} style={{ left: 12, top: 52 }}>{emptySlots}</div>
        <div className={styles.plat} style={{ right: 16, top: 80 }} />
        <div className={styles.plat} style={{ left: 16, top: 150 }} />
        <div className={styles.hp} style={{ right: 10, top: 132 }}>YOU<div className={styles.bar}><i style={{ width: '100%' }} /></div></div>
        <div className={styles.balls} style={{ right: 12, top: 172 }}>{emptySlots}</div>
        <div className={styles.textBox}>
          BUILD YOUR<br />TEAM OF SIX.
          <div className={styles.menu}>▶ADD<br />&nbsp;RANDOM</div>
        </div>
      </div>
      <div className={styles.base}>
        <span className={styles.gbLogo}>SHOWDOWN</span>
        <span className={styles.btns}><span /><span /></span>
      </div>
    </div>
  );
}
```

`components/grail/Doors.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { GRAIL_FACES } from '@/lib/grail/assets';
import { ShowdownDevice } from './ShowdownDevice';
import styles from './grail.module.css';

/** The two exits from the home page. The grail card lands in the Vault door's slot at the end of the sequence. */
export function Doors() {
  return (
    <div className={styles.doorRow}>
      <Link href="/cards" className={styles.door} data-door="vault">
        <div className={styles.doorObj} data-door-card>
          <div className={styles.doorScale}>
            <div className={styles.vaultCard} data-vault-card>
              <Image src={GRAIL_FACES.front} alt="" fill sizes="(min-width: 768px) 270px, 160px" />
            </div>
          </div>
        </div>
        <p className="meta text-gold">01 — The collection</p>
        <h3 className={styles.doorWord}>Vault</h3>
        <span className="text-link">Enter the vault →</span>
      </Link>
      <Link href="/showdown" className={styles.door} data-door="showdown">
        <div className={styles.doorObj}>
          <div className={styles.doorScale}><ShowdownDevice /></div>
        </div>
        <p className="meta">02 — The arena</p>
        <h3 className={styles.doorWord}>Showdown</h3>
        <span className="text-link">Enter the arena →</span>
      </Link>
    </div>
  );
}
```

`components/grail/GlitterCanvas.tsx` (stub; Task 8 replaces it):

```tsx
'use client';

export function GlitterCanvas({ className }: { className?: string }) {
  return <canvas aria-hidden data-glitter className={className} />;
}
```

- [ ] **Step 5: Add the section markup** `components/grail/GrailSequence.tsx` (static only in this task)

```tsx
'use client';
import { useRef } from 'react';
import { GRAIL } from '@/data/showcase';
import { formatUpdated, priceCaption } from '@/lib/grail/format';
import { Doors } from './Doors';
import { GlitterCanvas } from './GlitterCanvas';
import { GrailCard } from './GrailCard';
import styles from './grail.module.css';

export interface GrailSequenceProps {
  price: string | null;
  priceSource: string | null;
  updatedAt: string | null;
  tierCount: number;
  cardCount: number;
}

const DESCRIPTION =
  'A vault of rare Pokémon cards, from Base Set holos to Gold Stars. Every card is ranked into six tiers of rarity and priced daily from TCGplayer and Cardmarket. Open the vault to browse them, or take a team of six into Showdown.';
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The home page: welcome → grail card → doors. Server-rendered as three stacked screens; on capable
 * clients the effect (Task 8) pins them into one scroll-driven stage.
 */
export function GrailSequence({ price, priceSource, updatedAt, tierCount, cardCount }: GrailSequenceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const updated = formatUpdated(updatedAt);

  return (
    <section ref={rootRef} className={styles.root} aria-label="Pokémon Vault">
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.welcome} data-part="welcome">
          <div className={`meta ${styles.metaRow}`}>
            <span>Ed. 01 — The collector’s index</span>
            <span>Rare cards · ranked · priced daily</span>
          </div>
          <h1 className={`grain ${styles.siteName}`}>Pokémon <br className="md:hidden" />Vault</h1>
          <p className={styles.subhead}>Rare by design /<br />priced by the market</p>
          <div className={styles.intro}>
            <p className="copy">{DESCRIPTION}</p>
            <a href="#grail" className="text-link" data-goto="0.25">Scroll to open the vault ↓</a>
          </div>
          <ul className={`meta ${styles.facts}`}>
            <li><span className="text-red">{pad2(tierCount)}</span> tiers</li>
            <li><span className="text-red">{cardCount}</span> cards on file</li>
            {updated && <li>Prices updated {updated}</li>}
            <li><span className="text-gold">Grail</span> inside ↓</li>
          </ul>
          <span className={`meta ${styles.vlabel}`} aria-hidden>Independent collector’s index</span>
        </div>

        <div id="grail" className={styles.grail}>
          <div className={`meta ${styles.metaRow}`} data-part="grailMeta">
            <span>No. 001 — The rarest card in the vault</span>
            <span>{GRAIL.setName} · {GRAIL.year} · {GRAIL.number}</span>
          </div>
          <h2 className={`grain ${styles.cardName}`} data-part="headline">{GRAIL.name}</h2>
          <div className={styles.cardHome} data-card-home><GrailCard /></div>
          <div className={styles.grailCopy} data-part="grailCopy">
            <p className={styles.kicker}>Gold Star /<br />one of the rarest</p>
            <p className="copy">A shiny Rayquaza marked with a gold star, the rarest print in its set. Kept in tier 01 of the vault.</p>
            <a href="#doors" className="text-link" data-goto="0.74">Scroll to turn the card ↓</a>
          </div>
          {price && (
            <div className={styles.price} data-part="price">
              <p className="meta text-gold">Est. market — {priceSource}</p>
              <p className={`text-gold-gradient ${styles.priceValue}`}>{price}</p>
            </div>
          )}
          <span className={`meta ${styles.vlabel}`} data-part="grailLabel" aria-hidden>Tier 01 — The Grail</span>
          <ol className={styles.captions}>
            <li className={styles.caption} data-caption="0">
              <p className="meta">01 / The card</p>
              <p className={styles.captionTitle}>{GRAIL.name}</p>
              <p className="meta text-gold">{GRAIL.setName} · {GRAIL.number}</p>
            </li>
            <li className={styles.caption} data-caption="1">
              <p className="meta">02 / The print</p>
              <p className={styles.captionTitle}>Shiny<br />Gold<br />Star</p>
              <p className="meta text-gold">Released {GRAIL.year}</p>
            </li>
            <li className={styles.caption} data-caption="2">
              <p className="meta">03 / The price</p>
              <p className={`text-gold-gradient ${styles.captionTitle}`}>{priceCaption(price)}</p>
              {priceSource && <p className="meta text-gold">Est. market — {priceSource}</p>}
            </li>
          </ol>
          <div className={styles.rule} data-part="rule" aria-hidden><div className={styles.ruleFill} data-part="ruleFill" /></div>
        </div>

        <div id="doors" className={styles.doors} data-part="doors">
          <div className={styles.doorsLayout}>
            <div data-part="doorsTitle">
              <p className="meta">Contents — Ed. 01</p>
              <h2 className={styles.chooseTitle}>Choose<br />your<br />door.</h2>
              <p className="copy max-w-[300px]">The grail goes back in the vault. Follow it in, or take a team to the arena.</p>
            </div>
            <Doors />
          </div>
        </div>

        <GlitterCanvas className={styles.glitter} />
      </div>
    </section>
  );
}
```

Note: `rootRef` and `stageRef` are only attached here; Task 8's effect reads them.

- [ ] **Step 6: Rewrite `app/page.tsx`**

```tsx
import { GrailSequence } from '@/components/grail/GrailSequence';
import { TIER_ORDER } from '@/data/rarity';
import { GRAIL, SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';
import { formatPrice } from '@/lib/tcg/normalize';

export const revalidate = 86400;

async function grailPrice() {
  try {
    return (await getCard(GRAIL.id))?.price ?? null;
  } catch {
    return null; // the home page still renders; the price block and caption fall back
  }
}

export default async function Home() {
  const price = await grailPrice();
  return (
    <main>
      <GrailSequence
        price={price ? formatPrice(price) : null}
        priceSource={price?.source ?? null}
        updatedAt={price?.updatedAt ?? null}
        tierCount={TIER_ORDER.length}
        cardCount={SHOWCASE.length}
      />
      <footer className="px-6 pb-16 pt-10 text-center">
        <p className="copy mx-auto max-w-2xl text-indigo">
          Prices are estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon data from PokéAPI. Not affiliated with Nintendo, Creatures, or Game Freak.
        </p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 7: Remove the manga home and its decor**

```bash
git rm components/home/Hero.tsx components/home/Chapter.tsx components/home/FeaturePanels.tsx components/motion/GoldParticles.tsx public/decor/hero-hand.webp public/decor/vault-door.webp public/decor/arena.webp
```

- In `lib/manga/decor.ts`, change line 4 to `export const DECOR = ['vault-shelves', 'grail-spotlight'] as const;`.
- In `lib/manga/decor.test.ts`:
  - Change the two `decorSrc` cases to use `'vault-shelves'`: `expect(decorSrc('vault-shelves', ['vault-shelves'])).toBe('/decor/vault-shelves.webp');` and `expect(decorSrc('vault-shelves', [])).toBeNull();`.
  - Change the list test to `it('lists the Vault page assets', () => { expect(DECOR).toEqual(['vault-shelves', 'grail-spotlight']); });`.
- Set `lib/manga/decor-manifest.json` to `["vault-shelves","grail-spotlight"]` followed by a trailing newline.
- In `scripts/compress-decor.ts`, replace the `MAX_WIDTH` object with `{ 'vault-shelves': 1920, 'grail-spotlight': 1600 }`.

- [ ] **Step 8: Run all tests**

Run: `npm run lint && npm test && npx playwright test e2e/home.spec.ts e2e/smoke.spec.ts e2e/manga.spec.ts`
Expected: all PASS.

Then open `http://localhost:3000` with reduced motion turned on (DevTools → Rendering → `prefers-reduced-motion: reduce`). You should see three stacked screens matching mockup frames 0, 1 (static card) and 3.

- [ ] **Step 9: Commit**

```bash
git add -A app/page.tsx components/grail lib/manga scripts/compress-decor.ts e2e public/decor
git commit -m "feat(home): replace the manga home with the editorial grail layout

Static welcome, grail card, and doors screens; the scroll sequence
builds on this markup next.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The pinned scroll sequence and gold-dust glitter

**Files:**
- Modify: `components/grail/GrailSequence.tsx` (add the effect), `components/grail/GlitterCanvas.tsx` (replace the stub), `e2e/home.spec.ts` (append)

**Interfaces:**
- Consumes:
  - From Task 2: `cardPose`, `poseTransform`, `glintStyle`, `welcomeStyle`, `headlineStyle`, `grailCopyOpacity`, `captionAt`, `ruleStyle`, `doorsStyle`, `glitterRate`, `meshShape`, `meshLightStrength`, `Rect`
  - From Task 4: `grailStore`, `resetGrailStore`, `GOLDS`, `emit`, `step`, `emissionCount`, `Particle`
  - From Task 5: `scrollToY`
  - From Task 7: the DOM contract

- [ ] **Step 1: Write the failing e2e tests**: append to `e2e/home.spec.ts`

```ts
const opacity = (page: import('@playwright/test').Page, sel: string) =>
  page.locator(sel).first().evaluate(el => Number(getComputedStyle(el).opacity));
/** Scroll to a fraction of the pinned sequence (desktop pin = 3 viewport heights). */
const scrollToProgress = async (page: import('@playwright/test').Page, p: number) => {
  await page.evaluate(p => window.scrollTo(0, window.innerHeight * 3 * p), p);
  await page.waitForTimeout(900); // let Lenis settle
};

test.describe('scroll sequence (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('welcome → grail → turn → doors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('[data-glitter]')).toBeVisible();
    expect(await opacity(page, '[data-grail-card]')).toBe(0);

    await scrollToProgress(page, 0.25);
    expect(await opacity(page, '[data-part="welcome"]')).toBe(0);
    expect(await opacity(page, '[data-grail-card]')).toBe(1);
    expect(await opacity(page, '[data-part="grailCopy"]')).toBe(1);

    await scrollToProgress(page, 0.5);
    expect(await opacity(page, '[data-caption="1"]')).toBe(1);

    await scrollToProgress(page, 1);
    expect(await opacity(page, '[data-grail-card]')).toBe(0);
    expect(await opacity(page, '[data-vault-card]')).toBe(1);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test('tabbing to a door jumps to the end of the sequence', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the vault/ }).focus();
    await page.waitForTimeout(900);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    expect(await opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('End key lands cleanly on the doors', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(1200);
    expect(await opacity(page, '[data-grail-card]')).toBe(0);
    expect(await opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('after a resize at the end, the card slot still matches the Vault door', async ({ page }) => {
    await page.goto('/');
    await scrollToProgress(page, 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3 * 0.99));
    await page.waitForTimeout(900);
    const [card, door] = await Promise.all([
      page.locator('[data-grail-card]').boundingBox(),
      page.locator('[data-door-card]').boundingBox(),
    ]);
    expect(Math.abs(card!.x + card!.width / 2 - (door!.x + door!.width / 2))).toBeLessThan(12);
    expect(Math.abs(card!.y + card!.height / 2 - (door!.y + door!.height / 2))).toBeLessThan(12);
  });

  test('leaving for the Vault stops the sequence without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await scrollToProgress(page, 1);
    await page.getByRole('link', { name: /Enter the vault/ }).click();
    await expect(page).toHaveURL(/\/cards$/);
    await expect(page.locator('[data-glitter]')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe('short desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 600 } });
  test('welcome link shows on load and both doors fit at the end', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Scroll to open the vault/ })).toBeInViewport({ ratio: 1 });
    await scrollToProgress(page, 1);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('both doors fit side by side at the end', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2)); // mobile pin = 2 viewport heights
    await page.waitForTimeout(900);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test e2e/home.spec.ts -g "scroll sequence|short desktop|phone"`
Expected: FAIL. `[data-glitter]` is hidden, because nothing sets `data-sequenced` yet.

- [ ] **Step 3: Replace `components/grail/GlitterCanvas.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { GOLDS, emissionCount, emit, step, type Particle } from '@/lib/grail/particles';
import { grailStore } from '@/lib/grail/store';

const DUST_RADII = [1, 1.5, 2, 2.5, 3.5];
const MOTE_RADII = [4, 6, 8];

/** A soft round gold dot, pre-rendered once so each frame is just drawImage calls. */
function sprite(rgb: string, r: number, mote: boolean): HTMLCanvasElement {
  const radius = mote ? r : r * 2.2; // dust gets a glow halo around its core
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(radius * 2) + 2;
  const g = c.getContext('2d')!;
  const m = c.width / 2;
  const grad = g.createRadialGradient(m, m, 0, m, m, radius);
  grad.addColorStop(0, `rgba(${rgb},${mote ? 0.35 : 1})`);
  grad.addColorStop(mote ? 0.7 : 0.45, `rgba(${rgb},${mote ? 0.2 : 0.6})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(m, m, radius, 0, Math.PI * 2);
  g.fill();
  return c;
}

const nearest = (radii: number[], size: number) =>
  radii.reduce((best, r, i) => (Math.abs(r - size) < Math.abs(radii[best] - size) ? i : best), 0);

/** Gold dust streaming off the grail card. Emission strength and position come from grailStore. */
export function GlitterCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const sprites = GOLDS.map(rgb => ({
      dust: DUST_RADII.map(r => sprite(rgb, r, false)),
      mote: MOTE_RADII.map(r => sprite(rgb, r, true)),
    }));
    const pool: Particle[] = [];
    const cap = () => (window.innerWidth < 768 ? 1000 : 2500);
    let carry = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!visible && pool.length === 0) return;
      const { rate, emitter } = grailStore.glitter;
      if (visible && emitter && rate > 0) {
        const n = emissionCount(rate, dt, cap(), carry);
        carry = n.carry;
        emit(pool, n.count, emitter, cap());
      }
      step(pool, dt);
      ctx.clearRect(0, 0, w, h);
      for (const p of pool) {
        const set = sprites[p.color];
        const img = p.mote ? set.mote[nearest(MOTE_RADII, p.size)] : set.dust[nearest(DUST_RADII, p.size)];
        ctx.globalAlpha = p.alpha * (1 - p.age / p.life);
        ctx.drawImage(img, p.x - img.width / 2, p.y - img.height / 2);
      }
      ctx.globalAlpha = 1;
    };

    resize();
    io.observe(canvas);
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden data-glitter className={className} />;
}
```

- [ ] **Step 4: Add the sequence effect to `components/grail/GrailSequence.tsx`**

Replace the import block at the top of the file with:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY } from '@/components/motion/SmoothScroll';
import { GRAIL } from '@/data/showcase';
import { formatUpdated, priceCaption } from '@/lib/grail/format';
import {
  captionAt, cardPose, doorsStyle, glintStyle, glitterRate, grailCopyOpacity, headlineStyle,
  meshLightStrength, meshShape, poseTransform, ruleStyle, welcomeStyle, type Rect,
} from '@/lib/grail/sequence';
import { grailStore, resetGrailStore } from '@/lib/grail/store';
import { Doors } from './Doors';
import { GlitterCanvas } from './GlitterCanvas';
import { GrailCard } from './GrailCard';
import styles from './grail.module.css';
```

Under `const pad2 = …`, add:

```tsx
/** Pinned scroll distance in viewport heights (section = 400vh desktop / 300vh phone, per the spec). */
const PIN_VH = { desktop: 3, phone: 2 } as const;
```

Inside `GrailSequence`, directly after `const updated = formatUpdated(updatedAt);`, add the effect:

```tsx
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    gsap.registerPlugin(ScrollTrigger);

    const one = (sel: string) => root.querySelector<HTMLElement>(sel);
    const el = {
      welcome: one('[data-part="welcome"]')!,
      headline: one('[data-part="headline"]')!,
      grailMeta: one('[data-part="grailMeta"]')!,
      grailCopy: one('[data-part="grailCopy"]')!,
      price: one('[data-part="price"]'), // absent when the card has no price
      grailLabel: one('[data-part="grailLabel"]')!,
      rule: one('[data-part="rule"]')!,
      ruleFill: one('[data-part="ruleFill"]')!,
      doors: one('[data-part="doors"]')!,
      doorsTitle: one('[data-part="doorsTitle"]')!,
      vaultDoor: one('[data-door="vault"]')!,
      showdownDoor: one('[data-door="showdown"]')!,
      doorCard: one('[data-door-card]')!,
      vaultCard: one('[data-vault-card]')!,
      home: one('[data-card-home]')!,
      card: one('[data-grail-card]')!,
      captions: [...root.querySelectorAll<HTMLElement>('[data-caption]')],
    };
    /** Fade a block; once invisible it leaves the tab order and the accessibility tree. */
    const show = (node: HTMLElement | null, opacity: number) => {
      if (!node) return;
      node.style.opacity = String(opacity);
      node.inert = opacity < 0.05;
    };

    root.dataset.sequenced = '';

    let home: Rect = { left: 0, top: 0, width: 1, height: 1 };
    let door: Rect = home;
    // Both boxes are untransformed wrappers, so their rects are stable whatever the sequence is doing.
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const rel = (n: HTMLElement): Rect => {
        const r = n.getBoundingClientRect();
        return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
      };
      home = rel(el.home);
      door = rel(el.doorCard);
    };

    const apply = (p: number) => {
      const pose = cardPose(p, home, door);
      el.card.style.transform = poseTransform(pose);
      el.card.style.opacity = String(pose.opacity);
      const glint = glintStyle(p);
      el.card.style.setProperty('--glint', `${glint.x}%`);
      el.card.style.setProperty('--glint-o', String(glint.opacity));

      const welcome = welcomeStyle(p);
      show(el.welcome, welcome.opacity);
      el.welcome.style.transform = `translateY(${welcome.y}px)`;

      const headline = headlineStyle(p);
      el.headline.style.opacity = String(headline.opacity);
      el.headline.style.transform = `translateY(${headline.y}px) scale(${headline.scale})`;

      const copy = grailCopyOpacity(p);
      for (const node of [el.grailMeta, el.grailCopy, el.price, el.grailLabel]) show(node, copy);

      const active = captionAt(p);
      el.captions.forEach((caption, i) => show(caption, i === active ? 1 : 0));

      const rule = ruleStyle(p);
      el.rule.style.opacity = String(rule.opacity);
      el.ruleFill.style.transform = `scaleX(${rule.fill})`;

      const doors = doorsStyle(p);
      el.doorsTitle.style.opacity = String(doors.titleOpacity);
      el.doorsTitle.style.transform = `translateY(${doors.titleY}px)`;
      el.vaultDoor.style.opacity = String(doors.titleOpacity);
      el.showdownDoor.style.opacity = String(doors.showdownOpacity);
      el.showdownDoor.style.transform = `translateX(${doors.showdownX}px)`;
      el.vaultCard.style.opacity = String(doors.doorCardOpacity);
      // Invisible door links must not catch clicks meant for the grail screen; focus still reaches them (see onFocusIn).
      el.doors.style.pointerEvents = doors.titleOpacity > 0.5 ? '' : 'none';

      const ry = (pose.ry * Math.PI) / 180;
      const cx = home.left + home.width / 2 + pose.x;
      const cy = home.top + home.height / 2 + pose.y;
      Object.assign(grailStore.mesh, meshShape(p));
      grailStore.light = { x: cx, y: cy, r: home.width * 1.4 * pose.scale, strength: meshLightStrength(p) };
      grailStore.glitter.rate = glitterRate(p);
      grailStore.glitter.emitter = {
        x: cx,
        y: cy,
        w: home.width * pose.scale * Math.max(0.12, Math.abs(Math.cos(ry))),
        h: home.height * pose.scale,
        dir: Math.cos(ry) >= 0 ? -1 : 1,
      };
    };

    const pinVh = () => (window.innerWidth < 768 ? PIN_VH.phone : PIN_VH.desktop);
    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: () => `+=${window.innerHeight * pinVh()}`,
      pin: stage,
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: self => { measure(); apply(self.progress); },
      onUpdate: self => apply(self.progress),
    });
    measure();
    apply(trigger.progress);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    const at = (p: number) => trigger.start + (trigger.end - trigger.start) * p;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
      if (!link) return;
      e.preventDefault();
      scrollToY(at(Number(link.dataset.goto)));
    };
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement).closest('[data-door]') && trigger.progress < 1) scrollToY(trigger.end, true);
    };
    root.addEventListener('click', onClick);
    root.addEventListener('focusin', onFocusIn);

    return () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('focusin', onFocusIn);
      trigger.kill(true);
      resetGrailStore();
      delete root.dataset.sequenced;
    };
  }, []);
```

`trigger.kill(true)` reverts the pin spacer, so leaving the page restores the DOM.

- [ ] **Step 5: Run the e2e tests**

Run: `npx playwright test e2e/home.spec.ts`
Expected: all PASS. If `'welcome → grail → turn → doors'` reads an opacity like `0.98`, Lenis hadn't settled: raise that test's `waitForTimeout` to 1200. Don't loosen the assertion.

- [ ] **Step 6: Run the unit tests and lint**

Run: `npm run lint && npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/grail/GrailSequence.tsx components/grail/GlitterCanvas.tsx e2e/home.spec.ts
git commit -m "feat(home): pin the grail sequence and stream gold dust off the card

Scroll drives the welcome fade, the 360 degree card turn with captions,
and the flight into the Vault door. Reduced motion keeps the static page.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Visual and performance verification

**Files:**
- Create: none in the repo. Screenshots go to `design-assets/grail/verify/` (git-ignored).

- [ ] **Step 1: Screenshot the real page at the mockup moments**

Save as `design-assets/grail/verify/shoot.mjs`:

```js
import { chromium } from 'playwright';
const out = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const browser = await chromium.launch();
for (const [w, h, pin] of [[1440, 900, 3], [375, 812, 2]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  for (const p of [0, 0.25, 0.45, 1]) {
    await page.evaluate(([p, pin]) => window.scrollTo(0, window.innerHeight * pin * p), [p, pin]);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/home-${w}-p${p}.png` });
  }
  await page.close();
}
await browser.close();
```

Run with the dev server up: `node design-assets/grail/verify/shoot.mjs`

Expected: 8 PNGs. Compare `home-1440-p0`, `-p0.25`, `-p0.45` and `-p1` against mockup `frame0`, `frame1`, `frame2` and `frame3`. Check that:
- the mesh is indigo
- every Anton heading is red
- all mono text is indigo
- the price and card values are gold
- the glitter is round dust, with no stars
- the card lands in the Vault door slot

Fix any difference in `grail.module.css` before continuing.

- [ ] **Step 2: Lighthouse (mobile simulation) on a production build**

Run: `npm run build && npx next start -p 3100`

In another terminal:

```bash
npx --yes lighthouse http://localhost:3100/ --only-categories=performance --form-factor=mobile --quiet --chrome-flags="--headless=new" --output=json --output-path=design-assets/grail/verify/lh.json
node -e "const r=require('./design-assets/grail/verify/lh.json');console.log('LCP',r.audits['largest-contentful-paint'].displayValue,'CLS',r.audits['cumulative-layout-shift'].displayValue,'TBT',r.audits['total-blocking-time'].displayValue)"
```

Expected: LCP ≤ 4.1 s and CLS 0. If LCP is worse, check that the LCP element is the "POKÉMON VAULT" h1 and not the card image; Anton is a single small file, so it should be quick. Then stop the server.

- [ ] **Step 3: Full suite**

Run: `npm run lint && npm test && npm run build && npx playwright test`
Expected: everything passes.

- [ ] **Step 4: Commit any fixes from Steps 1–2**

```bash
git add -A components/grail app
git commit -m "fix(home): match the approved mockup after visual review

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Skip this commit if nothing changed.
