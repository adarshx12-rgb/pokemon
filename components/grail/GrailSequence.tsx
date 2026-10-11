'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY, syncScrollSize } from '@/components/motion/SmoothScroll';
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
/** Pinned scroll distance in viewport heights (section = 400vh desktop / 300vh phone, per the spec). */
const PIN_VH = { desktop: 3, phone: 2 } as const;

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

  const pinVh = () => (window.innerWidth < 768 ? PIN_VH.phone : PIN_VH.desktop);
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${window.innerHeight * pinVh()}`,
    pin: stage,
    scrub: true,
    invalidateOnRefresh: true,
    onRefresh: self => { syncScrollSize(); measure(); apply(self.progress); },
    onUpdate: self => apply(self.progress),
  });
  syncScrollSize(); // the pin spacer has just changed the page height
  measure();
  apply(trigger.progress);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

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
    root.removeEventListener('click', onClick);
    root.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('scrollend', onScrollEnd);
    trigger.kill(true);
    resetGrailStore();
    delete root.dataset.sequenced;
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
  const updated = formatUpdated(updatedAt);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    // Wait for the scroll to rest first: a smooth scroll still running from before hydration (an End key,
    // say) would otherwise carry on to its old target after the pin has changed the page height.
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
    return () => {
      cancelAnimationFrame(raf);
      stop?.();
    };
  }, []);

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
