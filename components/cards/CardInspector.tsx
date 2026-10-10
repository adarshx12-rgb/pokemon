'use client';
import { useState } from 'react';
import { TiltCard } from '@/components/TiltCard';
import { InkPanel } from '@/components/manga/InkPanel';
import { guideFor } from '@/data/identifyGuide';
import type { Card } from '@/lib/tcg/types';

export function CardInspector({ card, children }: { card: Card; children: React.ReactNode }) {
  const items = guideFor(card.era);
  const [active, setActive] = useState<string | null>(null);
  const region = items.find(i => i.key === active)?.region;

  return (
    <div className="grid gap-16 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <div className="mx-auto w-full max-w-md lg:sticky lg:top-32 lg:h-fit">
        <InkPanel className="screentone p-6">
          <TiltCard src={card.images.large} alt={`${card.name} — ${card.setName}`} width={734} height={1024} foil priority sizes="(min-width: 1024px) 448px, 90vw">
            {region && (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-md border-2 border-gold-light shadow-[0_0_0_9999px_rgba(10,10,10,0.55),0_0_24px_rgba(245,215,122,0.8)] transition-all duration-300"
                style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.w}%`, height: `${region.h}%` }}
              />
            )}
          </TiltCard>
        </InkPanel>
      </div>
      <div className="space-y-12">
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
