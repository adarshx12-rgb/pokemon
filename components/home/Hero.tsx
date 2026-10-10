'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TiltCard } from '@/components/TiltCard';
import { GoldParticles } from '@/components/motion/GoldParticles';
import type { Card } from '@/lib/tcg/types';

function SplitText({ text, charClassName = '' }: { text: string; charClassName?: string }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
      {[...text].map((c, i) => (
        <span key={i} data-char className={`inline-block ${charClassName}`}>{c === ' ' ? ' ' : c}</span>
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
          <p data-hero-fade className="eyebrow mb-6">The collector’s vault, since 1996</p>
          <h1 className="font-display text-6xl leading-[0.95] md:text-8xl lg:text-9xl">
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
