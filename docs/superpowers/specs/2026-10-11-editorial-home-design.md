# Editorial Home ("The Grail") — Design Spec

**Date:** 2026-10-11
**Branch:** feat/pokemon-vault
**Replaces:** the manga theme (`2026-10-10-manga-theme-design.md`), which the user rejected as looking AI-made.
**Approved mockup:** `design-assets/grail/mockup/` (git-ignored): `frame0.png` (welcome), `frame1.png` (the grail), `frame2.png` and `spin-strip.png` (the turn), `frame3.png` (the doors). `index.html` / `spin.html` hold the reference values.

## Goal

Rebuild the home page as a print-magazine spread: black page, red headlines, indigo text and wire-mesh walls on both sides. It opens on the site name and a short description, then the vault's grail card — Rayquaza ★ Gold Star — turning in 3D as you scroll, shedding gold glitter, then shrinking into the **Vault** door beside a **Showdown** door.

Restraint is the point. One idea per screen, lots of black, gold only where there is value.

## Scope

| In | Out (later specs) |
|---|---|
| Site foundation: fonts, colour tokens, nav, background, page curtain, 404 | Vault (`/cards`) and card-detail restyle; deleting the manga components they still use |
| Home page (`/`) in full | Showdown redesign (its cobalt/red/white Game Boy plan stands) |

Interim effect on other pages: `/cards`, `/cards/[id]` and `/showdown` inherit the new fonts, nav and mesh background but keep their manga layouts until their own pass. That is accepted.

## 1. Design system

**Colour roles**

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#050507` | page background |
| `--color-red` | `#ff2b2b` | headlines and titles only: every Anton element (site name, card name, subheads, door words, "CHOOSE YOUR DOOR."), the logo, the active nav link, and key numbers in meta (~5.5:1 on ink) |
| `--color-indigo` | `#6e6bff` | all other text: nav links, meta lines, captions, paragraphs, "… →" links and their underlines, vertical labels, progress rule (5.05:1 on ink, passes AA for small text) |
| `--color-indigo-deep` | `#4a4dff` | mesh lines; vertex dots `#7c78ff` |
| gold (existing `--color-gold*`) | `#d9b45a` / `#fff1b8` / `#8a6a22` | value only: price, card glow, glitter, gold edge |

Cobalt `#0047AB` / `#002E7A` and Pokédex red `#C8102E` appear on home only inside the Showdown door (Showdown's own palette). Existing cream/muted tokens stay for the pages not yet restyled.

**Type** (via `next/font/google` in `app/layout.tsx`)
- `--font-display` → **Anton** 400: ultra-condensed headlines, uppercase. A print-grain mask (SVG `feTurbulence` as `mask-image`, values from the mockup) applies to the hero headline only.
- `--font-mono` → **JetBrains Mono** 400/500: nav, meta lines, captions, body copy. Uppercase, `0.14em` tracking, 11px for meta and 10.5px with `1.75` line height for paragraphs.
- `--font-pixel` → Press Start 2P (unchanged; used in the Showdown door).
- Dela Gothic One and Zen Kaku Gothic New are removed. With them goes the CJK `preload: false` workaround.
- `body` defaults to the mono stack.

**Links, not buttons:** calls to action are indigo mono uppercase text with a 1px underline offset 6px, followed by "→". There are no pill buttons.

**Balance rule:** red is reserved for display type so it stays loud. Everything set in mono is indigo, so each screen reads as red, indigo and a touch of gold on black, never mostly red.

## 2. Site foundation

- **`MeshBackground`** replaces `MarbleBackground` in the layout. It's a fixed, full-viewport `<canvas>` at z −10 showing two indigo wire-mesh walls, left and right, that fade to black toward the centre: a valley the content floats in.
  - **Drawing:** a perspective-projected grid of about 56×40 points. Height is a wall term (rises with distance from centre) plus summed sine waves. Lines are deep indigo `#4a4dff` with alpha falling with depth and toward the centre; vertex dots are indigo `#7c78ff`. No white or lavender: the mesh must read as indigo.
  - **Motion:** the waves drift slowly (phase moves with time), drawn at up to 30 fps. Drawing pauses when the tab is hidden.
  - **Parameters:** opening width, wall height, horizon, wave amplitude, and a gold "light" (position, radius, strength) that turns nearby vertex dots gold. Pages may change these; the home sequence animates them (section 3). Other pages use the defaults.
  - **Reduced motion:** draw one static frame and redraw only on resize.
  - **Device pixel ratio:** capped at 2.
  - **Below 768px:** walls narrower and opacity reduced to 60% so text stays readable.
- **`SiteNav`**:
  - **Left:** "POKÉMON VAULT" in Anton, red.
  - **Centre:** indigo mono links: The Grail (`/`), Vault (`/cards`), Showdown (`/showdown`). The active link is red and underlined.
  - **Right (md and up):** indigo mono "Prices updated {date}", from the hero card's price `updatedAt`. Omitted on other pages.
  - **Remove:** `mix-blend-difference`. The nav sits on ink with no background.
- **`app/template.tsx` curtain:** the gold wipe becomes an ink wipe with a 1px red leading edge. It stays hidden under reduced motion via CSS, so server and client markup match.
- **404 page:** "ERROR 404" mono meta, Anton headline "NOTHING IN THIS DRAWER.", and a "Back to the vault →" link. It drops `SfxText` and `caption-box`.

## 3. Home page

`app/page.tsx` renders one section, `<GrailSequence>`, then the footer. `Hero`, `Chapter` and `FeaturePanels` are deleted.

### Data

- `data/showcase.ts`: `FEATURED_CARD_ID` becomes `'ex8-107'` (Rayquaza ★, EX Deoxys 107/107). This is a deliberate editorial pick: the 3D textures are prepared for this card.
- The page fetches it with `getCard` (existing retries plus snapshot fallback). Price, set and number come from data. The face images are local files (section 5), so the hero never depends on the flaky image CDN.
- Missing price: the price block is omitted. A missing card entirely: render the static textures, with name and set from a small constant.
- Copy never claims "most valuable", since prices move. The claim is "The rarest card in the vault": Gold Stars are the rarest print.

### Scroll sequence

One pinned section, driven by a single progress value `p` from 0 to 1 via GSAP ScrollTrigger with `scrub`. Lenis already feeds ScrollTrigger.

**Scroll length:** 400vh on desktop, 300vh below 768px (the welcome stage adds about 100vh).

| p | Stage | What happens |
|---|---|---|
| 0–0.08 | **Welcome** (frame 0) | The first screen; no card yet. Indigo meta lines ("Ed. 01 — The collector's index" / "Rare cards · ranked · priced daily"). Giant red "POKÉMON VAULT" with print grain at about `clamp(84px, 14.7vw, 216px)`. Red subhead "RARE BY DESIGN / PRICED BY THE MARKET" (Anton 64px). The indigo mono description below, then an indigo "Scroll to open the vault ↓" link. Bottom-right facts from data: "06 tiers", "{n} cards on file" (numbers red), "Grail inside ↓" (gold). Vertical indigo label "Independent collector's index". |
| 0.08–0.2 | **Welcome → grail** | The welcome type slides up and fades. "RAYQUAZA" rises into place and the card fades and scales in from 0.85 to its arrival pose. The mesh's gold light switches on under the card. |
| 0.2–0.3 | **The grail** (frame 1) | Hold: indigo meta lines; giant red "RAYQUAZA" behind the card; card tilted (`rotateY −24° rotateX 10° rotateZ −5°`); red "GOLD STAR / ONE OF THE RAREST" with an indigo paragraph and an indigo "Scroll to turn the card ↓" link bottom-left; price bottom-right in gold; vertical indigo label "Tier 01 — The Grail". Light gold dust around the card. |
| 0.3–0.74 | **The turn** | The card turns a full 360° about Y, eased. Extra tilt and skew follow `sin` of the angle (values in `spin.html`). Glitter emission follows angular speed × \|sin(angle)\| and peaks edge-on. The headline grows to 1.15× and fades to 0.2 opacity. Captions swap in order: `01 / The card` (name, set, number), `02 / The print` ("SHINY GOLD STAR"), `03 / The price` (gold price). Caption labels are indigo, caption titles red, values gold. An indigo progress rule fills along the bottom. The mesh opens a little, the waves amplify, and the gold light follows the card. |
| 0.74–1 | **The doors** (frame 3) | The headline and captions fade. The card shrinks and flies to the Vault door slot (target rect measured from the door, FLIP-style). Red "CHOOSE YOUR DOOR." and its indigo paragraph rise in at left. The Showdown door slides in from the right. The mesh pulls back to the edges and its light settles on the Vault door. At `p = 1` the flying card hands off to the real Vault door card (crossfade over the last 2%). |

**Welcome description** (final copy, 4–5 lines at 420px):

> A vault of rare Pokémon cards, from Base Set holos to Gold Stars. Every card is ranked into six tiers of rarity and priced daily from TCGplayer and Cardmarket. Open the vault to browse them, or take a team of six into Showdown.

Scrubbing works in both directions.

### Components (`components/grail/`)

- **`GrailSequence`** (client): owns the pin and timeline. It writes pose values as CSS custom properties on a root element, not React state, and pushes mesh and glitter parameters through a small module-level store. It renders the server markup it receives as children/props, so all text is in the HTML.
- **`GrailCard`**: CSS 3D card, built as in `spin.html`.
  - Two faces with `backface-visibility: hidden`: front = sharpened scan, back = black glass with gold border. Rounded corners (4.5% of width).
  - Left and right gold edge strips, 5px thick, rotated 90°, so the edge reads as gold when the card is edge-on.
  - A glint band whose position and opacity follow the angle.
  - Transform comes from CSS variables set by `GrailSequence`. Decorative: `aria-hidden`.
- **`GlitterCanvas`** (client): a full-section canvas with a pooled particle system (cap 2,500 on desktop, 1,000 below 768px).
  - **Look:** round gold dust, never stars. Each particle is a soft radial-gradient dot, radius 1–5px including glow (mostly small), in four golds: `#ffe296`, `#d9b45a`, `#fff1b8`, `#c4963c`. About 7% are larger out-of-focus motes (3–8px, low alpha) for depth.
  - **Count:** scales with spin speed, from about 400 live at rest to 2,500 at the edge-on peak.
  - **Spread:** particles stay close to the card (reach about 1.2 card widths), not scattered across the screen.   - **Motion:** they emit from the card's projected edges and drift opposite the turn, slightly upward, fading over 0.6–1.4s.
  - **Performance:** a pre-rendered sprite per size and colour, drawn with `drawImage`, keeps 2,500 particles at 60fps. Emission rate comes from the store. It stops when off-screen and is not rendered under reduced motion.
- **`Doors`**: two `<Link>` doors, each a card-sized object (270×370 desktop, 200×274 mobile) above mono meta (Vault's in gold, Showdown's in indigo), a red Anton word (58px) and an indigo "Enter … →" line. The whole door is the link target. Hover: the object lifts 6px, the underline turns indigo, the word turns to a red outline.
  - **Vault door → `/cards`:** the card front `<Image>` with alt "Rayquaza Gold Star — enter the vault", and a gold glow.
  - **Showdown door → `/showdown`:** a mini Game Boy in CSS.
    - The body is a cobalt gradient.
    - The white screen has a 3px ink border and RIVAL and YOU health bars.
    - It shows two rows of six empty Poké Ball slots and two platform ellipses.
    - The text box reads "BUILD YOUR / TEAM OF SIX." with a "▶ADD / RANDOM" menu.
    - The base has "SHOWDOWN" in pixel type and two red buttons.
    - No Pokémon sprites.
  - The doors tilt toward each other (`rotateY ±14°`).

**Pure logic (`lib/grail/`)**, unit-tested:
- `sequence.ts`:
  - `stageAt(p)` → `welcome | toGrail | grail | turn | doors`
  - `welcomeStyle(p)`
  - `cardPose(p, doorRect, viewport) → { rx, ry, rz, skew, scale, x, y }`
  - `glitterRate(p)`
  - `captionAt(p)`
  - `headlineStyle(p)`
  - `meshParams(p)`
- `mesh.ts`: `projectGrid(params, time, size) → points`, with alpha and gold-light weights.

### Layout

**Desktop (1440×900 reference; mockup values)**
- **Gutters:** 48px.
- **Welcome:** site name centred at top about 190px, with 32px top padding so the grain mask doesn't clip the É accent. Subhead at 430px; description at 600px, 420px wide.
- **Headline:** Anton at `clamp(120px, 22vw, 340px)`, centred, top about 190px.
- **Card:** 310×432, centred, overlapping the headline's lower half.
- **Price:** Anton 64px with a gold gradient fill.
- **Doors stage:**
  - Left column: 400px, with "CHOOSE YOUR DOOR." at 104px.
  - Doors start at 490px and 840px from the left, top 205px.

**Below 768px**
- Welcome: the site name on two lines ("POKÉMON / VAULT") at 26vw, the subhead at 11vw, then the description and link.
- Headline at `24vw`; the card is 62vw wide.
- The arrival copy stacks under the card, with the price after it.
- The doors stage stacks the title, then the Vault door, then the Showdown door, full width and centred.
- No horizontal scroll at 375px.

### Footer

A centred mono line in muted red at 70% opacity: the existing attribution text (TCGplayer/Cardmarket via the Pokémon TCG API, PokéAPI, not affiliated…).

## 4. Accessibility and fallbacks

- **Real text in the DOM:**
  - The h1 is the welcome headline "Pokémon Vault" (uppercased in CSS). "Rayquaza" and "Choose your door." are h2s; the door words are h3s.
  - Captions are real text, and only the active one is exposed (others `aria-hidden` and `inert`).
  - Door links are real `<Link>`s in reading order.
- **Reduced motion:** no pin, spin, glitter canvas, or mesh animation. The section renders as three normal blocks:
  - frame 0 (welcome)
  - frame 1 (static tilted card, front, a few static gold dots)
  - frame 3 (title plus both doors)
  
  The page curtain is hidden.
- **No JavaScript:** the same static layout. The sequence enhances it on mount, so server HTML equals the reduced-motion layout. This avoids hydration mismatch and layout shift.
- **Focus:** tabbing to a door link while the sequence is mid-scroll scrolls to `p = 1` (ScrollTrigger `scrollTo` the end) so the focused door is visible.
- **Contrast:** red on ink and gold on ink both pass AA. The mesh never sits under body copy at full strength; the centre fade guarantees it.

## 5. Assets

Sources are in `design-assets/grail/` (git-ignored):
- `front-4k.png`: official scan upscaled by Higgsfield Bytedance Image Upscale. Faithful; no redraw.
- `back-v1.png`: the back, generated with GPT Image 2.5.

A new `scripts/build-grail-assets.ts` (sharp) produces committed WebPs in `public/grail/`:
- `rayquaza-front-{600,1200}.webp`, rounded corners on a transparent background, quality 86
- `rayquaza-back-{600,1200}.webp`

The front is the hero image: preloaded, with the `next/image` `priority` option. The back loads lazily after first paint.

The old home decor (`hero-hand`, `vault-door`, `arena`) is removed from `public/decor/` and the decor manifest. `vault-shelves` and `grail-spotlight` stay until the Vault pass.

No further Higgsfield generation is planned. Video generation of the card was attempted and blocked ("ip_detected"; not charged), which is why the spin is built in code.

## 6. Removals (this pass)

- **Components:**
  - `components/home/Hero.tsx`, `Chapter.tsx`, `FeaturePanels.tsx`
  - `components/motion/MarbleBackground.tsx` and `lib/parallax.ts` with its test (used only by the marble)
  - `GoldParticles`
- **Layout:** the root layout stops mounting `InkDefs`. `InkPanel` (still used by the Vault pages) needs `#ink-rough`, so a new `app/cards/layout.tsx` mounts `InkDefs` until the Vault pass removes it.
- **Images:** `public/marble*.webp`.
- **Tests:** the home assertions in `e2e/manga.spec.ts` (fonts, 3-panel hero, chapter) and the home heading check in `e2e/smoke.spec.ts` ("Rare by design."). Replace them with the new home spec; keep the Vault-page assertions that still hold.

## 7. Testing and verification

- **Unit (vitest):**
  - `lib/grail/sequence.ts`: stage boundaries; angle is 0 at p ≤ 0.12 and 360 at p ≥ 0.68; pose at p = 1 equals the door rect; glitter rate peaks near the edge-on angles and is about 0 at the ends.
  - `lib/grail/mesh.ts`: centre columns fully faded; alpha falls with depth; output size matches the grid.
- **E2E (Playwright)** in `e2e/home.spec.ts`:
  - The h1 has the accessible name "Pokémon Vault", and an h2 "Rayquaza" exists.
  - The Vault and Showdown door links navigate correctly.
  - Under `reducedMotion: 'reduce'`, both doors are visible without scrolling the pin, and there's no glitter canvas.
  - No failed `/grail/` requests.
  - No horizontal overflow at 375px.
  - Headline uses Anton; body uses JetBrains Mono.
  - No console errors.
- **Visual:** Playwright screenshots at 1440×900 and 375×812 for p = 0 (welcome), 0.25 (grail), about 0.45 (edge-on) and 1, compared by eye against the approved mockup frames.
- **Performance:**
  - Lighthouse mobile simulation, with the home LCP no worse than the pre-manga 4.1s.
  - CLS at 0.
  - The main thread stays smooth while scrubbing: the mesh is capped at 30fps, the glitter pool is capped, and transforms only (no layout) during the sequence.
- `npm run lint`, `npm test`, `npm run build` all pass.

## Decisions log

| Topic | Decision |
|---|---|
| Direction | Option A: replace manga entirely with the editorial direction |
| Hero art | No plant or generated creature. The real card is the hero; the mesh texture is the user's reference |
| Hero card | Rayquaza ★ Gold Star `ex8-107`, pinned editorially |
| Card back | Plain black glass with a gold border (user's call); generated once |
| Spin | Built in code (CSS 3D), scroll-scrubbed. Video was blocked for IP and is less sharp anyway |
| Arrival | Site name and a 4–5 line description first, then the card (user, 2026-10-11) |
| Colour balance | Red for headings and titles only; indigo for all other text and the mesh; gold for card values (user) |
| Glitter | Live canvas of round gold dust (no stars), dense around the card, follows spin speed (user) |
| End state | Card becomes the Vault door, beside a cobalt Game Boy Showdown door |
| Fonts | Anton + JetBrains Mono (+ Press Start 2P for pixel UI) |

## Clarifications (implementation plan, 2026-10-11)

- 404 headline stays "A wild MissingNo." (existing test and tone) in the new Anton/indigo style.
- "Prices updated {date}" appears in the welcome screen's facts list, not the nav: the nav lives in the shared layout and has no page data.
- Mobile doors sit side by side at 160×219 so both fit the pinned screen; desktop viewports 760px tall or less use 200×274 doors.
- The Vault door image has empty alt text; the link is named by its own text ("01 — The collection Vault Enter the vault →").
- Footer copy is indigo (red at 70% opacity would fail AA for small text).
- One 1200px WebP per face; next/image builds the srcset.
- Body text colour stays cream on the not-yet-restyled pages; the home section sets indigo itself.
