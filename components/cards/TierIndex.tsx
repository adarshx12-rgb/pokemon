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
      <ol className="space-y-3">
        {tiers.map(t => (
          <li key={t}>
            <a
              href={`#tier-${t}`}
              aria-current={active === t ? 'true' : undefined}
              className={`flex items-center gap-3 text-xs uppercase tracking-[0.3em] transition ${active === t ? 'text-gold-light' : 'text-muted hover:text-cream'}`}
            >
              <span className={`h-px transition-all ${active === t ? 'w-8 bg-gold' : 'w-4 bg-line'}`} />
              {TIER_META[t].label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
