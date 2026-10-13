'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY, syncScrollSize } from '@/components/motion/SmoothScroll';
import { GRAIL } from '@/data/showcase';
import { formatUpdated, priceCaption } from '@/lib/grail/format';
import {
  captionOpacity, cardPose, doorsStyle, glintStyle, glitterRate, grailCopyOpacity, headlineStyle,
  easeInOut, meshLightStrength, meshShape, poseTransform, ruleStyle, seg, welcomeStyle, type Rect,
} from '@/lib/grail/sequence';
import { grailStore, resetGrailStore } from '@/lib/grail/store';
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
  'A vault of rare Pokémon cards, from Base Set holos to Gold Stars. Browse six curated tiers with dated market estimates, or choose every move in a Pokémon showdown.';
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Larger screens pin for three viewport heights; phones use normal document flow. */
const PIN_VH = 3;

/**
 * Pins the stage and drives every part from the scroll progress. Returns the teardown, which reverts the
 * pin spacer and restores the static page.
 */
function startSequence(root: HTMLElement, stage: HTMLElement): () => void {
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

  // The static page may already be scrolled or focused when the pin arrives: a restored scroll position,
  // or an End key, Tab or scroll before hydration. Note where it was so the same screen stays in view.
  const staticY = window.scrollY;
  const absTop = (n: HTMLElement) => n.getBoundingClientRect().top + staticY;
  const [rootTop, grailTop, doorsTop] = [root, one('#grail')!, el.doors].map(absTop);
  const doorFocused = !!document.activeElement?.closest('[data-door]');
  const staticMax = document.documentElement.scrollHeight - window.innerHeight;

  root.dataset.sequenced = '';
  // CSS composes the headline's scroll transform with its depth plane.
  el.headline.style.removeProperty('transform');

  let home: Rect = { left: 0, top: 0, width: 1, height: 1 };
  let door: Rect = home;
  let motionScale = 1;
  let progress = 0;
  const camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const layers = [...root.querySelectorAll<HTMLElement>('[data-depth]')].map(node => ({
    node,
    distance: node.dataset.depth === 'back' ? -0.55 : node.dataset.depth === 'middle' ? 0.65 : 1.2,
    welcome: !!node.closest('[data-part="welcome"]'),
  }));
  // Both boxes are untransformed wrappers, so their rects are stable whatever the sequence is doing.
  const measure = () => {
    motionScale = window.innerWidth < 768 || window.innerHeight < 500 ? 0.4 : 1;
    const s = stage.getBoundingClientRect();
    const rel = (n: HTMLElement): Rect => {
      const r = n.getBoundingClientRect();
      return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
    };
    home = rel(el.home);
    door = rel(el.doorCard);
  };

  const apply = (p: number) => {
    progress = p;
    // Project each plane independently: opacity/masks on the title and welcome would
    // flatten a shared preserve-3d scene. These transforms stay sharp during fades.
    const depthStrength = 1 - easeInOut(seg(p, 0.74, 0.94));
    // Cursor is a small accent; the persistent planes and scroll supply the depth.
    const pointerX = camera.x * 0.2;
    const pointerY = camera.y * 0.2;
    for (const layer of layers) {
      const drift = layer.welcome ? -52 * seg(p, 0, 0.24) : 24 - 48 * seg(p, 0.14, 0.74);
      const amount = layer.distance * motionScale * depthStrength;
      layer.node.style.setProperty('--depth-x', `${pointerX * 22 * amount}px`);
      layer.node.style.setProperty('--depth-y', `${(pointerY * 14 + drift) * amount}px`);
      layer.node.style.setProperty('--depth-rx', `${-pointerY * 1.8 * amount}deg`);
      layer.node.style.setProperty('--depth-ry', `${pointerX * 2.2 * amount}deg`);
    }
    const pose = cardPose(p, home, door);
    // The near card follows the viewer, then returns exactly to its measured door slot.
    const cardDepth = motionScale * depthStrength;
    pose.x += pointerX * 18 * cardDepth;
    pose.y += pointerY * 12 * cardDepth;
    pose.rx -= pointerY * 2.5 * cardDepth;
    pose.ry += pointerX * 3.5 * cardDepth;
    el.card.style.transform = poseTransform(pose);
    el.card.style.opacity = String(pose.opacity);
    const glint = glintStyle(p);
    el.card.style.setProperty('--glint', `${glint.x}%`);
    el.card.style.setProperty('--glint-o', String(glint.opacity));

    const welcome = welcomeStyle(p);
    show(el.welcome, welcome.opacity);
    el.welcome.style.transform = `translate3d(0, ${welcome.y}px, 0)`;

    const headline = headlineStyle(p);
    el.headline.style.opacity = String(headline.opacity);
    el.headline.style.setProperty('--headline-y', `${headline.y}px`);
    el.headline.style.setProperty('--headline-scale', String(headline.scale));

    const copy = grailCopyOpacity(p);
    for (const node of [el.grailMeta, el.grailCopy, el.price, el.grailLabel]) show(node, copy);

    el.captions.forEach((caption, i) => show(caption, captionOpacity(p, i)));

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
    // Mutated in place: this runs on every scroll update. resetGrailStore nulls both, so create them then.
    const light = (grailStore.light ??= { x: 0, y: 0, r: 0, strength: 0 });
    light.x = cx;
    light.y = cy;
    light.r = home.width * 1.4 * pose.scale;
    light.strength = meshLightStrength(p);
    grailStore.glitter.rate = glitterRate(p);
    const emitter = (grailStore.glitter.emitter ??= { x: 0, y: 0, w: 0, h: 0, dir: 1 });
    emitter.x = cx;
    emitter.y = cy;
    emitter.w = home.width * pose.scale * Math.max(0.12, Math.abs(Math.cos(ry)));
    emitter.h = home.height * pose.scale;
    emitter.dir = Math.cos(ry) >= 0 ? -1 : 1;
  };

  // A real scrubbed playhead smooths wheel, touch and keyboard updates together.
  // `scrub` alone cannot smooth work performed directly in ScrollTrigger.onUpdate.
  const playhead = { progress: 0 };
  const animation = gsap.to(playhead, {
    progress: 1,
    duration: 1,
    ease: 'none',
    paused: true,
    onUpdate: () => apply(playhead.progress),
  });
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${window.innerHeight * PIN_VH}`,
    pin: stage,
    animation,
    scrub: 0.35,
    invalidateOnRefresh: true,
    onRefresh: self => {
      syncScrollSize();
      measure();
      animation.progress(self.progress);
      apply(self.progress);
    },
  });
  syncScrollSize(); // the pin spacer has just changed the page height
  measure();
  apply(trigger.progress);
  // Only tick while the camera is moving; scroll uses the existing scrubbed playhead.
  // Touch retains native gestures and gets the same depth separation from scroll.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const tickCamera = (_time: number, deltaMs: number) => {
    const blend = 1 - Math.exp(-Math.min(deltaMs, 50) / 130);
    camera.x += (camera.targetX - camera.x) * blend;
    camera.y += (camera.targetY - camera.y) * blend;
    const settled = Math.abs(camera.targetX - camera.x) + Math.abs(camera.targetY - camera.y) < 0.001;
    if (settled) {
      camera.x = camera.targetX;
      camera.y = camera.targetY;
      gsap.ticker.remove(tickCamera);
    }
    apply(progress);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    camera.targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
    camera.targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
    gsap.ticker.add(tickCamera);
  };
  const resetCamera = () => {
    camera.targetX = camera.targetY = 0;
    gsap.ticker.add(tickCamera);
  };
  stage.addEventListener('pointermove', onPointerMove, { passive: true });
  stage.addEventListener('pointerleave', resetCamera);
  window.addEventListener('blur', resetCamera);
  let disposed = false;
  document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

  const at = (p: number) => trigger.start + (trigger.end - trigger.start) * p;
  // Static screens map onto the sequence: welcome → 0–0.25, grail → 0.25–1, doors → the end.
  // Set natively: Lenis caches the page height and hasn't seen the pin spacer yet, so it would clamp.
  const resume = doorFocused || staticY >= doorsTop ? trigger.end
    : staticY <= rootTop ? null
    : staticY < grailTop ? at((0.25 * (staticY - rootTop)) / (grailTop - rootTop))
    : at(0.25 + (0.75 * (staticY - grailTop)) / (doorsTop - grailTop));
  if (resume !== null) window.scrollTo({ top: resume, behavior: 'instant' });

  // A native smooth scroll that began in the frame before the pin (End pressed during the idle wait) still
  // runs to the static page's bottom, which is mid-turn on the pinned page. Finish it at the doors instead.
  const startedAt = performance.now();
  const onScrollEnd = () => {
    window.removeEventListener('scrollend', onScrollEnd);
    const aimedAtStaticEnd = staticMax >= doorsTop && Math.abs(window.scrollY - staticMax) <= 1;
    if (aimedAtStaticEnd && performance.now() - startedAt < 1500 && trigger.progress < 1) {
      window.scrollTo({ top: trigger.end, behavior: 'instant' });
    }
  };
  window.addEventListener('scrollend', onScrollEnd);

  const onClick = (e: MouseEvent) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
    if (!link) return;
    e.preventDefault();
    scrollToY(at(Number(link.dataset.goto)));
  };
  const onFocusIn = (e: FocusEvent) => {
    // Natively, like the resume above: right after the pin, Lenis still clamps to the old page height.
    if ((e.target as HTMLElement).closest('[data-door]') && trigger.progress < 1) window.scrollTo({ top: trigger.end, behavior: 'instant' });
  };
  root.addEventListener('click', onClick);
  root.addEventListener('focusin', onFocusIn);

  return () => {
    disposed = true;
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerleave', resetCamera);
    window.removeEventListener('blur', resetCamera);
    gsap.ticker.remove(tickCamera);
    root.removeEventListener('click', onClick);
    root.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('scrollend', onScrollEnd);
    trigger.kill(true);
    animation.kill();
    resetGrailStore();
    delete root.dataset.sequenced;
    // Restore the readable document when resizing from the pinned desktop to mobile.
    const animated = new Set([el.welcome, el.headline, el.grailMeta, el.grailCopy, el.price, el.grailLabel,
      el.rule, el.ruleFill, el.doors, el.doorsTitle, el.vaultDoor, el.showdownDoor, el.vaultCard, el.card,
      ...el.captions, ...layers.map(layer => layer.node)]);
    for (const node of animated) {
      if (!node) continue;
      node.inert = false;
      for (const property of ['opacity', 'transform', 'pointer-events', '--depth-x', '--depth-y', '--depth-rx',
        '--depth-ry', '--headline-y', '--headline-scale', '--glint', '--glint-o']) node.style.removeProperty(property);
    }
    syncScrollSize();
  };
}

/**
 * The home page: welcome → grail card → doors. Server-rendered as three stacked screens; on capable
 * clients the effect (Task 8) pins them into one scroll-driven stage.
 */
export function GrailSequence({ price, priceSource, updatedAt, tierCount, cardCount }: GrailSequenceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const updated = formatUpdated(updatedAt);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const media = gsap.matchMedia();
    media.add('(min-width: 768px) and (min-height: 501px) and (prefers-reduced-motion: no-preference)', () => {
      // Let any pre-hydration scroll finish before measuring the pin.
      let stop: (() => void) | undefined;
      let lastY = NaN;
      let raf = 0;
      const settle = () => {
        if (window.scrollY === lastY) stop = startSequence(root, stage);
        else {
          lastY = window.scrollY;
          raf = requestAnimationFrame(settle);
        }
      };
      raf = requestAnimationFrame(settle);
      return () => { cancelAnimationFrame(raf); stop?.(); };
    });
    return () => media.revert();
  }, []);

  return (
    <section ref={rootRef} className={styles.root} aria-label="POKÉFAME">
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.welcome} data-part="welcome">
          <div className={`meta ${styles.metaRow}`} data-depth="front">
            <span>Ed. 01 — The collector’s index</span>
            <span>Rare cards · ranked · dated estimates</span>
          </div>
          <h1 className={`grain ${styles.siteName}`} data-depth="back" aria-label="POKÉFAME">POKÉ<br className="md:hidden" />FAME</h1>
          <p className={styles.subhead} data-depth="middle">Rare by design /<br />priced by the market</p>
          <div className={styles.intro} data-depth="front">
            <p className="copy">{DESCRIPTION}</p>
            <div className={styles.mobileActions}>
              <Link href="/cards">Browse the Vault <span aria-hidden>↗</span></Link>
              <Link href="/showdown">Play Showdown <span aria-hidden>↗</span></Link>
            </div>
            <a href="#grail" className={`text-link ${styles.scrollLink}`} data-goto="0.25">Scroll to open the vault ↓</a>
          </div>
          <ul className={`meta ${styles.facts}`} data-depth="front">
            <li><span className="text-red">{pad2(tierCount)}</span> tiers</li>
            <li><span className="text-red">{cardCount}</span> cards on file</li>
            {updated && <li>Prices updated {updated}</li>}
            <li><span className="text-gold">Grail</span> inside ↓</li>
          </ul>
          <span className={`meta ${styles.vlabel}`} aria-hidden>Independent collector’s index</span>
        </div>

        <div id="grail" className={styles.grail}>
          <div className={`meta ${styles.metaRow}`} data-part="grailMeta" data-depth="front">
            <span>No. 001 — The rarest card in the vault</span>
            <span>{GRAIL.setName} · {GRAIL.year} · {GRAIL.number}</span>
          </div>
          <h2 className={`grain ${styles.cardName}`} data-part="headline" data-depth="back">{GRAIL.name}</h2>
          <div className={styles.cardHome} data-card-home><GrailCard flipped={flipped} /></div>
          <button type="button" className={styles.flipCard} aria-pressed={flipped} onClick={() => setFlipped(value => !value)}>
            {flipped ? 'Show card front' : 'Flip the card'} <span aria-hidden>↻</span>
          </button>
          <div className={styles.grailCopy} data-part="grailCopy" data-depth="front">
            <p className={styles.kicker}>Gold Star / <br />one of the rarest</p>
            <p className="copy">A shiny Rayquaza marked with a gold star, the rarest print in its set. Kept in tier 01 of the vault.</p>
            <a href="#doors" className={`text-link ${styles.turnLink}`} data-goto="0.74">Scroll to turn the card ↓</a>
            <Link href={`/cards/${GRAIL.id}`} className={`text-link ${styles.mobileCardLink}`}>Explore Rayquaza ↗</Link>
          </div>
          {price && (
            <div className={styles.price} data-part="price" data-depth="front">
              <p className="meta text-gold">Est. market — {priceSource}</p>
              <p className={`text-gold-gradient ${styles.priceValue}`}>{price}</p>
            </div>
          )}
          <span className={`meta ${styles.vlabel}`} data-part="grailLabel" aria-hidden>Tier 01 — The Grail</span>
          <ol className={styles.captions} data-depth="front">
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
              <h2 className={styles.chooseTitle}>Choose <br />your <br />door.</h2>
              <p className={`copy max-w-[300px] ${styles.doorsCopy}`}>The grail goes back in the vault. Follow it in, or take a team to the arena.</p>
            </div>
            <Doors />
          </div>
        </div>

        <GlitterCanvas className={styles.glitter} />
      </div>
    </section>
  );
}
