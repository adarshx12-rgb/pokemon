import { GrailSequence } from '@/components/grail/GrailSequence';
import { TIER_ORDER } from '@/data/rarity';
import { GRAIL, SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';
import { formatPrice } from '@/lib/tcg/normalize';

export const revalidate = 86400;

async function grailPrice() {
  try {
    return (await getCard(GRAIL.id))?.price ?? null;
  } catch {
    return null; // the home page still renders; the price block and caption fall back
  }
}

export default async function Home() {
  const price = await grailPrice();
  return (
    <main>
      <GrailSequence
        price={price ? formatPrice(price) : null}
        priceSource={price?.source ?? null}
        updatedAt={price?.updatedAt ?? null}
        tierCount={TIER_ORDER.length}
        cardCount={SHOWCASE.length}
      />
      <footer className="px-6 pb-16 pt-10 text-center">
        <p className="copy mx-auto max-w-2xl text-indigo">
          Prices are estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon data from PokéAPI. Not affiliated with Nintendo, Creatures, or Game Freak.
        </p>
      </footer>
    </main>
  );
}
