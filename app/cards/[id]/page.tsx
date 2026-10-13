import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardInspector } from '@/components/cards/CardInspector';
import { CardDetails } from '@/components/cards/CardDetails';
import { SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 86400;

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SHOWCASE.map(s => ({ id: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const card = await getCard((await params).id);
  if (!card) notFound();
  return pageMetadata({
    title: `${card.name} #${card.number} — ${card.setName} Pokemon Card`,
    description: `Explore the ${card.name} Pokémon card #${card.number} from ${card.setName}. View artwork, rarity, collector notes, and available dated price estimates.`,
    path: `/cards/${card.id}`,
    image: { url: card.images.large, alt: `${card.name} #${card.number} Pokémon card from ${card.setName}` },
  });
}

export default async function CardPage({ params }: Params) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();

  return (
    <main className="px-4 pb-32 pt-28 md:px-10">
      <Link href="/cards" className="eyebrow transition hover:text-gold-light">← Back to the Vault</Link>
      <div className="mt-12">
        <CardInspector card={card}>
          <CardDetails card={card} />
        </CardInspector>
      </div>
    </main>
  );
}
