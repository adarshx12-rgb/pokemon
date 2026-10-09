import { Reveal } from '@/components/motion/Reveal';
import { TIER_META, type Tier } from '@/data/rarity';
import type { Card } from '@/lib/tcg/types';
import { CardTile } from './CardTile';

const ACCENT: Record<Tier, string> = {
  grail: 'text-gold-gradient',
  ultra: 'text-[#E5E4E2]',
  holo: 'text-[#C0C0C0]',
  rare: 'text-cream/80',
  uncommon: 'text-cream/60',
  common: 'text-cream/45',
};

export function TierBand({ tier, cards, rank }: { tier: Tier; cards: Card[]; rank: number }) {
  const meta = TIER_META[tier];
  return (
    <section id={`tier-${tier}`} data-tier={tier} data-testid="tier-band" className="scroll-mt-32">
      <Reveal className="mb-12 flex flex-col gap-4 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Tier {String(rank).padStart(2, '0')}</p>
          <h2 className={`font-serif text-6xl italic md:text-8xl ${ACCENT[tier]}`}>{meta.label}</h2>
        </div>
        <p className="max-w-sm text-sm text-muted">{meta.blurb}</p>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map(card => <CardTile key={card.id} card={card} />)}
      </div>
    </section>
  );
}
