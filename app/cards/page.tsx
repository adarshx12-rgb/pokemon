import type { Metadata } from 'next';
import { TierBand } from '@/components/cards/TierBand';
import { TierIndex } from '@/components/cards/TierIndex';
import { SHOWCASE } from '@/data/showcase';
import { getCards } from '@/lib/tcg/client';
import { groupByTier } from '@/lib/tcg/rank';

export const revalidate = 86400;
export const metadata: Metadata = { title: 'The Vault — Pokémon Vault' };

export default async function CardsPage() {
  const groups = groupByTier(await getCards(SHOWCASE.map(s => s.id)));
  return (
    <main className="px-6 pb-32 pt-36 md:px-16">
      <header className="mb-24 max-w-3xl">
        <p className="eyebrow">Ranked rarest to most common</p>
        <h1 className="mt-4 font-display text-7xl md:text-9xl">The <span className="text-gold-gradient emph">Vault</span></h1>
        <p className="mt-6 max-w-xl text-muted">
          Estimated market prices from TCGplayer (USD) and Cardmarket (EUR), refreshed daily. Raw, ungraded copies. Graded copies can sell for many times more.
        </p>
      </header>
      <div className="flex gap-16">
        <TierIndex tiers={groups.map(g => g.tier)} />
        <div className="min-w-0 flex-1 space-y-32">
          {groups.map((g, i) => <TierBand key={g.tier} tier={g.tier} cards={g.cards} rank={i + 1} />)}
        </div>
      </div>
    </main>
  );
}
