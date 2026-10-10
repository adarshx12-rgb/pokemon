# Manga Theme — Design Spec

**Date:** 2026-10-10
**Branch:** feat/pokemon-vault
**Inspiration:** santionispirits.com (WebGL manga panels as portals between scenes, ink-hatched rendering, heavy Japanese display type)

## Goal

Restyle Pokémon Vault as a manga, keeping the existing black/gold/cream palette. Home and Vault get the full manga-panel treatment; card detail gets light touches; Showdown keeps its separately planned Game Boy direction.

## Decisions

| Topic | Decision |
|---|---|
| Scope | Home + Vault full treatment; card detail light touches; Showdown untouched (only inherits nav/font changes) |
| Page style | **Night-ink**: black pages; cream ink borders/lines; gold screentone/halftone |
| Fonts | Dela Gothic One (display) + Zen Kaku Gothic New (body); Press Start 2P kept for Showdown; Cormorant Garamond and Inter removed |
| Technique | CSS/SVG/GSAP (no WebGL); a few original Higgsfield ink illustrations |
| Generated art | No Pokémon characters, Poké Balls, logos or text. Card art stays official scans |

## 1. Design system

**Tokens (unchanged colours):** ink `#0a0a0a`, surface `#141414`, line `#2a2418`, gold `#d4af37`, gold-light `#f5d77a`, gold-dark `#8c6b1f`, cream `#ede6d6`, muted `#8a8375`.

**Fonts** via `next/font/google` in `app/layout.tsx`:
- `--font-display` → Dela Gothic One (weight 400). Tailwind `font-display`. Replaces all `font-serif` usages (headings, logo, tier titles, 404).
- `--font-sans` → Zen Kaku Gothic New (400, 500, 700).
- `--font-pixel` → Press Start 2P (unchanged).
- Dela has no italic: former italic emphasis becomes `.text-gold-gradient` plus a `-skew-x-6` transform (`.emph` utility).

**CSS utilities** (`app/globals.css`):
- `.ink-panel` — 3px cream border, inset 1px gold hairline, `clip-path: var(--clip, none)` for angled shapes; border roughened via shared SVG filter `#ink-rough` (feTurbulence + feDisplacementMap) rendered once in the layout by `<InkDefs />`.
- `.screentone` — flat gold dot pattern (radial-gradient, ~6px pitch, low opacity).
- `.halftone-fade` — dot pattern masked by a linear gradient (dense → none).
- `.speed-lines` — radial burst via `repeating-conic-gradient` in cream at low opacity, masked to fade from centre.
- `.caption-box` — small cream-bordered rectangle for "TIER 01"-style captions.

**Components** (`components/manga/`):
- `InkDefs` — hidden `<svg>` with `#ink-rough` filter.
- `SpeechBubble` — cream bubble, ink text, tail direction prop (`left|right|bottom`).
- `SfxText` — large skewed Dela lettering with gold stroke; `aria-hidden`.
- `PanelReveal` — replaces `Reveal`: clip-path wipe along a direction prop (`left|right|up|diag`) on ScrollTrigger; no-op under reduced motion.

**Accessibility:** decorative SFX, tones and illustrations are `aria-hidden` / empty `alt`; text contrast stays AA (cream/gold-light on ink); all animation skipped under `prefers-reduced-motion`; headings/landmarks/h1 unchanged in meaning.

## 2. Home

**Hero spread** (no pinning, above the fold):
- Asymmetric 3-panel grid with angled gutters (`md:` and up; stacks on mobile).
  - Large left panel: h1 "RARE BY / DESIGN." (Dela, "DESIGN." in `.emph`), subtitle, CTAs, `.halftone-fade` behind.
  - Tall right panel: floating foil `TiltCard` on `.speed-lines`; `SpeechBubble` with card name + estimated price; `SfxText` "キラッ!".
  - Small inset panel: `hero-hand.webp`.
- Load sequence: panel borders draw in (stroke-dashoffset on SVG outlines) → content wipes in → SFX pops. GoldParticles retained.

**Pinned chapter** (desktop ≥ md, ScrollTrigger pin; on mobile a stacked panel list with `PanelReveal`):
1. "Every card has a story" — `vault-door.webp`.
2. "Ranked by rarity" — the six tier labels stacked as a tier list.
3. "Priced daily" — price `SpeechBubble` over a halftone chart motif.
4. "Six against six" — `arena.webp`.
5. CTA panel → on further scroll, zoom-through (scale + clip-path expand to full viewport) handing off to the features section.

**Feature panels:** two tilted `.ink-panel`s with a skewed gutter; hover adds `.speed-lines` + slight scale; "Explore" styled as a speech-bubble tail.

**Footer:** attribution in a narrow `.caption-box`.

## 3. Vault and card detail

**Vault header:** wide panel over `vault-shelves.webp` with `.halftone-fade` bottom; h1 "THE VAULT" in Dela; `SfxText` "ズラッ".

**Tier bands:** angled title panel per tier — `.caption-box` "TIER 01" + tier label in Dela. Intensity steps down by tier:
- grail: `grail-spotlight.webp` backdrop + gold `.speed-lines`
- ultra / holo: dense `.screentone`
- rare / uncommon: sparse dots
- common: plain ink panel

**Card grid:** each `CardTile` inside an `.ink-panel` with thin gutters. The highest-priced card per tier is a 2×2 splash panel (`sm:` and up) with a price `SpeechBubble`. Hover: `.speed-lines` behind + slight push-in. Existing `data-testid`s preserved.

**TierIndex:** vertical strip of small numbered panel tabs; active tab filled gold. Same IntersectionObserver logic.

**Card detail:** `CardInspector` image inside an `.ink-panel`; `PricePanel` gets a `.caption-box` header over `.screentone`; collector note becomes a `SpeechBubble`. No layout/behaviour change.

**Also restyled for consistency:** `SiteNav` (logo in Dela), `not-found.tsx` (Dela + `.emph`), buttons keep current shapes with new fonts.

## 4. Higgsfield assets

Model: GPT Image 2.5 (0.25 credits/image at time of writing; balance 533). User will first test the prompts locally; **no credits are spent without showing the user an exact `higgsfield generate cost` quote and getting approval.**

Shared style block prefixed to each prompt:

> Black-and-white Japanese manga illustration printed in negative: deep ink-black background (#0a0a0a), linework in warm cream (#ede6d6), shading done with metallic gold (#d4af37) screentone dots and fine cross-hatching. Bold brush-ink outlines with varied line weight, dramatic seinen-manga composition, high contrast, no color other than black, cream and gold. No text, no lettering, no speech bubbles, no logos, no panel borders, no watermark. Edges fade softly into pure black.

| File | Ratio | Used in | Subject |
|---|---|---|---|
| `hero-hand.webp` | 4:5 | Home hero inset | Gloved collector's hand reaching to a blank glowing card on a velvet pedestal, gold speed lines |
| `vault-door.webp` | 16:9 | Chapter panel 1 | Massive circular vault door opening from inside, light as radial speed lines, silhouette in doorway |
| `arena.webp` | 16:9 | Chapter panel 4 | Empty stone arena at night, two platforms (lower-left, upper-right), gold lightning between |
| `vault-shelves.webp` | 21:9 | Vault header | Gallery corridor of lit glass cases with blank cards, one-point perspective, gold spotlights |
| `grail-spotlight.webp` | 1:1 | Grail tier band | Blank card floating over ornate pedestal, single spotlight, radial burst, gold sparkles |

Files go in `public/decor/`, compressed to WebP (like `marble.webp`), loaded via `next/image` with `sizes`; below-the-fold images lazy. **Fallback:** every panel renders correctly without its illustration (screentone/speed-lines only), so the build is never blocked on assets.

## 5. Testing

- Existing Vitest unit tests and Playwright smoke tests must stay green (testids preserved).
- Add a Playwright check that the home chapter and vault tier bands render, and that reduced-motion mode shows all panel content without animation.
- Manual: mobile (375px) layout of hero/chapter/vault, no horizontal scroll; Lighthouse LCP not regressed vs. current home.

## Out of scope

Showdown redesign (separate cobalt/red/white plan), WebGL/shader rendering, generating card art.
