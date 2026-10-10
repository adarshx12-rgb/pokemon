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
  // Words are nowrap groups so the wide display face never breaks mid-word.
  return (
    <span className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
      {text.split(' ').map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {w > 0 && ' '}
          {[...word].map((c, i) => <span key={i} data-char className={`inline-block ${charClassName}`}>{c}</span>)}
        </span>
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
              <h1 className="font-display text-5xl uppercase leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl">
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
                <SpeechBubble tail="bottom" className="absolute -right-6 -top-10 text-sm max-md:hidden">
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
