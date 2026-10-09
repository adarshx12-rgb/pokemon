import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardInspector } from '@/components/cards/CardInspector';
import { PricePanel } from '@/components/cards/PricePanel';
import { TIER_META } from '@/data/rarity';
import { SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';

export const revalidate = 86400;

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SHOWCASE.map(s => ({ id: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const card = await getCard((await params).id);
  return { title: card ? `${card.name} (${card.setName}) — Pokémon Vault` : 'Card not found — Pokémon Vault' };
}

export default async function CardPage({ params }: Params) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();
  const note = SHOWCASE.find(s => s.id === id)?.note;

  return (
    <main className="px-6 pb-32 pt-36 md:px-16">
      <Link href="/cards" className="eyebrow transition hover:text-gold-light">← Back to the Vault</Link>
      <div className="mt-12">
        <CardInspector card={card}>
          <header>
            <p className="eyebrow">{TIER_META[card.tier].label} tier, {card.rarity ?? 'unknown rarity'}</p>
            <h1 className="mt-4 font-serif text-6xl md:text-7xl">{card.name}</h1>
            <p className="mt-2 text-muted">{card.setName} ({card.setSeries}), #{card.number}, {card.releaseDate.slice(0, 4)}</p>
          </header>
          <PricePanel price={card.price} />
          {note && <blockquote className="border-l-2 border-gold pl-6 font-serif text-2xl italic text-cream/90">{note}</blockquote>}
        </CardInspector>
      </div>
    </main>
  );
}
