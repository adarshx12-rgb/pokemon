import { Chapter } from '@/components/home/Chapter';
import { FeaturePanels } from '@/components/home/FeaturePanels';
import { Hero } from '@/components/home/Hero';
import { FEATURED_CARD_ID } from '@/data/showcase';
import { decorSrc } from '@/lib/manga/decor';
import { getCard } from '@/lib/tcg/client';

export const revalidate = 86400;

async function featuredCard() {
  try {
    return await getCard(FEATURED_CARD_ID);
  } catch {
    return null;
  }
}

export default async function Home() {
  const card = await featuredCard();
  return (
    <main>
      <Hero card={card} handSrc={decorSrc('hero-hand')} />
      <Chapter vaultDoorSrc={decorSrc('vault-door')} arenaSrc={decorSrc('arena')} />
      <FeaturePanels />
      <footer className="px-4 pb-16 text-center md:px-10">
        <p className="caption-box mx-auto max-w-2xl normal-case tracking-normal text-muted">
          Prices are estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon data from PokéAPI. Not affiliated with Nintendo, Creatures, or Game Freak.
        </p>
      </footer>
    </main>
  );
}
