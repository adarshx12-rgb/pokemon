'use client';
import { useEffect, useState } from 'react';
import { TIER_META, type Tier } from '@/data/rarity';

export function TierIndex({ tiers }: { tiers: Tier[] }) {
  const [active, setActive] = useState<Tier>(tiers[0]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-tier]'));
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute('data-tier') as Tier);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Rarity tiers" className="sticky top-32 hidden h-fit w-40 shrink-0 lg:block">
      <ol className="space-y-2">
        {tiers.map(t => (
          <li key={t}>
            <a
              href={`#tier-${t}`}
              aria-current={active === t ? 'true' : undefined}
              className={`flex items-center gap-3 border-2 px-3 py-2 font-display text-xs uppercase tracking-widest transition ${active === t ? 'border-cream bg-gold text-ink' : 'border-line text-muted hover:border-cream hover:text-cream'}`}
            >
              <span className={active === t ? 'text-ink' : 'text-gold'}>{String(tiers.indexOf(t) + 1).padStart(2, '0')}</span>
              {TIER_META[t].label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
