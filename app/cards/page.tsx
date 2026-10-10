import type { Metadata } from 'next';
import Image from 'next/image';
import { TierBand } from '@/components/cards/TierBand';
import { TierIndex } from '@/components/cards/TierIndex';
import { InkPanel } from '@/components/manga/InkPanel';
import { SfxText } from '@/components/manga/SfxText';
import { SHOWCASE } from '@/data/showcase';
import { decorSrc } from '@/lib/manga/decor';
import { SHAPES } from '@/lib/manga/panel';
import { getCards } from '@/lib/tcg/client';
import { groupByTier } from '@/lib/tcg/rank';

export const revalidate = 86400;
export const metadata: Metadata = { title: 'The Vault — Pokémon Vault' };

export default async function CardsPage() {
  const groups = groupByTier(await getCards(SHOWCASE.map(s => s.id)));
  const shelves = decorSrc('vault-shelves');
  return (
    <main className="px-4 pb-32 pt-28 md:px-10">
      <header className="mb-16">
        <InkPanel shape={SHAPES.banner} className="flex min-h-[22rem] items-end p-8 md:min-h-[28rem] md:p-14">
          {shelves && <Image src={shelves} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />}
          <div aria-hidden className="halftone-fade absolute inset-0" />
          <div className="relative max-w-3xl">
            <p className="caption-box">Ranked rarest to most common</p>
            <h1 className="mt-4 font-display text-7xl uppercase md:text-9xl">The <span className="text-gold-gradient emph">Vault</span></h1>
            <p className="mt-6 max-w-xl text-muted">
              Estimated market prices from TCGplayer (USD) and Cardmarket (EUR), refreshed daily. Raw, ungraded copies. Graded copies can sell for many times more.
            </p>
          </div>
          <SfxText className="absolute right-6 top-6 text-5xl md:right-12 md:top-10 md:text-7xl">ズラッ</SfxText>
        </InkPanel>
      </header>
      <div className="flex gap-16">
        <TierIndex tiers={groups.map(g => g.tier)} />
        <div className="min-w-0 flex-1 space-y-24">
          {groups.map((g, i) => (
            <TierBand key={g.tier} tier={g.tier} cards={g.cards} rank={i + 1} backdropSrc={g.tier === 'grail' ? decorSrc('grail-spotlight') : null} />
          ))}
        </div>
      </div>
    </main>
  );
}
