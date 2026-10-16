import type { Metadata } from 'next';
import Image from 'next/image';
import { TierBand } from '@/components/cards/TierBand';
import { TierIndex } from '@/components/cards/TierIndex';
import { VaultBrowser } from '@/components/cards/VaultBrowser';
import { InkPanel } from '@/components/manga/InkPanel';
import { SfxText } from '@/components/manga/SfxText';
import { SHOWCASE } from '@/data/showcase';
import { decorSrc } from '@/lib/manga/decor';
import { SHAPES } from '@/lib/manga/panel';
import { getCards } from '@/lib/tcg/client';
import { groupByTier } from '@/lib/tcg/rank';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 86400;
export const metadata: Metadata = pageMetadata({
  title: 'Rare Pokemon Cards & Card Prices',
  description: 'Browse Pokémon cards across six curated tiers. Explore rare cards, artwork, set details, collector notes, and dated market estimates in the Pokéfame Vault.',
  path: '/cards',
});

export default async function CardsPage() {
  const groups = groupByTier(await getCards(SHOWCASE.map(s => s.id)));
  const shelves = decorSrc('vault-shelves');
  return (
    <main className="px-4 pb-32 pt-28 md:px-10">
      <header className="mb-16">
        <InkPanel shape={SHAPES.banner} className="flex min-h-[22rem] items-end p-8 md:min-h-[28rem] md:p-14">
          {shelves && <Image src={shelves} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />}
          {shelves && <div aria-hidden className="absolute inset-0 bg-linear-to-r from-ink via-ink/70 to-transparent" />}
          <div aria-hidden className="halftone-fade absolute inset-0" />
          <div className="relative max-w-3xl">
            <p className="caption-box">{groups.reduce((total, group) => total + group.cards.length, 0)} cards · six curated tiers</p>
            <h1 className="mt-4 font-display text-6xl uppercase sm:text-7xl md:text-9xl">The <span className="text-gold-gradient emph">Vault</span></h1>
            <p className="mt-6 max-w-xl text-muted">
              Explore Pokémon cards and rare finds: discover the artwork, understand the printing, and keep track of the cards you love. Open any card for collector notes and a dated market estimate.
            </p>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted">Our tiers are editorial groupings, not official rarity rankings. Prices refer to raw, ungraded cards; check the finish and source date on each card.</p>
          </div>
          <SfxText className="absolute right-12 top-10 text-7xl max-md:hidden">ズラッ</SfxText>
        </InkPanel>
      </header>
      <div className="flex gap-16">
        <TierIndex tiers={groups.map(g => g.tier)} />
        <div className="min-w-0 flex-1 space-y-24">
          <VaultBrowser>
          {groups.map((g, i) => (
            <TierBand key={g.tier} tier={g.tier} cards={g.cards} rank={i + 1} backdropSrc={g.tier === 'grail' ? decorSrc('grail-spotlight') : null} />
          ))}
          </VaultBrowser>
        </div>
      </div>
    </main>
  );
}
