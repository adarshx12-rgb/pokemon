import Image from 'next/image';
import { InkPanel } from '@/components/manga/InkPanel';
import { PanelReveal } from '@/components/manga/PanelReveal';
import { TIER_META, type Tier } from '@/data/rarity';
import { SHAPES } from '@/lib/manga/panel';
import { splashCardId } from '@/lib/manga/splash';
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

/** Background intensity steps down with rarity. */
const TONE: Record<Tier, string> = {
  grail: 'speed-lines',
  ultra: 'screentone',
  holo: 'screentone',
  rare: 'screentone-sparse',
  uncommon: 'screentone-sparse',
  common: '',
};

export function TierBand({ tier, cards, rank, backdropSrc = null }: { tier: Tier; cards: Card[]; rank: number; backdropSrc?: string | null }) {
  const meta = TIER_META[tier];
  const splash = splashCardId(cards);
  return (
    <section id={`tier-${tier}`} data-tier={tier} data-testid="tier-band" className="scroll-mt-32">
      <PanelReveal dir={rank % 2 ? 'left' : 'right'} className="mb-3">
        <InkPanel shape={rank % 2 ? SHAPES.tiltL : SHAPES.tiltR} className="flex min-h-56 flex-col justify-end gap-4 p-8 md:flex-row md:items-end md:justify-between md:p-12">
          {backdropSrc && <Image src={backdropSrc} alt="" fill sizes="100vw" className="object-cover opacity-60" />}
          {backdropSrc && <div aria-hidden className="absolute inset-0 bg-linear-to-r from-ink/80 via-transparent to-ink/90" />}
          {TONE[tier] && <div aria-hidden className={`${TONE[tier]} absolute inset-0`} />}
          <div className="relative">
            <p className="caption-box">Curated tier {String(rank).padStart(2, '0')}</p>
            <h2 className={`mt-4 font-display text-4xl uppercase sm:text-6xl md:text-8xl ${ACCENT[tier]}`}>{meta.label}</h2>
          </div>
          <p className="relative max-w-sm text-sm text-muted">{meta.blurb}</p>
        </InkPanel>
      </PanelReveal>
      <div className="grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => <CardTile key={card.id} card={card} splash={card.id === splash} featured={index === 0 || card.id === splash} />)}
      </div>
    </section>
  );
}
