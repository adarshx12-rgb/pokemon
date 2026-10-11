'use client';
import { useState } from 'react';
import { TiltCard } from '@/components/TiltCard';
import { InkPanel } from '@/components/manga/InkPanel';
import { guideFor } from '@/data/identifyGuide';
import type { Card } from '@/lib/tcg/types';

export function CardInspector({ card, children, compact = false }: { card: Card; children: React.ReactNode; compact?: boolean }) {
  const items = guideFor(card.era);
  const [active, setActive] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const region = items.find(i => i.key === active)?.region;

  return (
    <div className={`grid gap-10 ${zoom ? '' : compact ? 'lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]'}`}>
      <div className={`mx-auto w-full lg:h-fit ${zoom ? 'max-w-2xl' : `max-w-md lg:sticky ${compact ? 'lg:top-24' : 'lg:top-32'}`}`}>
        <InkPanel className="screentone p-6">
          <TiltCard src={card.images.large} alt={`${card.name} — ${card.setName}`} width={734} height={1024} foil={card.tier !== 'common' && card.tier !== 'uncommon' && card.tier !== 'rare'} maxTilt={2} priority sizes={zoom ? '90vw' : '(min-width: 1024px) 448px, 90vw'}>
            {region && (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-md border-2 border-gold-light shadow-[0_0_0_9999px_rgba(10,10,10,0.55),0_0_24px_rgba(245,215,122,0.8)] transition-all duration-300"
                style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.w}%`, height: `${region.h}%` }}
              />
            )}
          </TiltCard>
        </InkPanel>
        <button type="button" aria-pressed={zoom} onClick={() => setZoom(!zoom)} className="mt-4 w-full cursor-pointer border border-line px-4 py-3 text-xs text-gold-light focus-visible:outline-2 focus-visible:outline-indigo">{zoom ? 'Return to details' : 'Enlarge artwork'}</button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">Reference artwork · condition varies by copy</p>
      </div>
      <div className="min-w-0 space-y-8">
        {children}
        <section>
          <h2 className="font-display text-4xl">How to <span className="text-gold-gradient emph">identify value</span></h2>
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
                  className={`flex w-full gap-6 py-6 text-left transition focus-visible:outline focus-visible:outline-gold ${active === item.key ? 'text-gold-light' : ''}`}
                >
                  <span className="font-display text-2xl text-gold">{i + 1}</span>
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
