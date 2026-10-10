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
    ? <>
        <Image src={src} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-80" />
        {/* Scrim keeps the panel title readable over bright art. */}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink via-ink/50 to-transparent" />
      </>
    : <div aria-hidden className="speed-lines absolute inset-0" />;
}

/**
 * A manga page that assembles panel by panel as you scroll (pinned on desktop),
 * then zooms through its last panel into the next section. Mobile and reduced
 * motion get a plain stack of panels.
 */
export function Chapter({ vaultDoorSrc, arenaSrc }: { vaultDoorSrc: string | null; arenaSrc: string | null }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const panels = gsap.utils.toArray<HTMLElement>('[data-chapter-panel]', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: '+=2600', pin: true, scrub: 0.6 } });
      panels.forEach((p, i) => {
        tl.fromTo(p, { clipPath: wipeFrom(i % 2 ? 'right' : 'left') }, { clipPath: WIPE_TO, duration: 1, ease: 'none' });
        tl.fromTo(p.querySelectorAll('[data-ink-stroke]'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, '<0.2');
      });
      const last = panels[panels.length - 1];
      // Zoom through the last panel, then fade it so it never spills over the next section.
      tl.to(last, { scale: 2.4, zIndex: 30, duration: 1.2, ease: 'power2.in' }, '+=0.3');
      tl.to(panels.slice(0, -1), { opacity: 0, duration: 0.6 }, '<');
      tl.to(last, { opacity: 0, duration: 0.5 }, '-=0.5');
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
