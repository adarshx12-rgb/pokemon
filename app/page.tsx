import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { PanelReveal } from '@/components/manga/PanelReveal';
import { FEATURED_CARD_ID } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';

export const revalidate = 86400;

async function featuredCard() {
  try {
    return await getCard(FEATURED_CARD_ID);
  } catch {
    return null;
  }
}

const FEATURES = [
  { href: '/cards', eyebrow: 'The Vault', title: 'From grail to common', body: 'A curated collection ranked by rarity tier, with estimated market prices refreshed daily and a guide to spotting what makes a card valuable.' },
  { href: '/showdown', eyebrow: 'Showdown', title: 'Six against six', body: 'Build two teams, then watch them battle on a Gen 2-style screen, decided by stats, speed, and type matchups.' },
];

export default async function Home() {
  const card = await featuredCard();
  return (
    <main>
      <Hero card={card} />
      <section className="grid gap-px border-y border-line bg-line/60 md:grid-cols-2">
        {FEATURES.map(f => (
          <PanelReveal key={f.href} className="bg-ink/75 backdrop-blur-sm">
            <Link href={f.href} className="group block p-10 md:p-16">
              <p className="eyebrow">{f.eyebrow}</p>
              <h2 className="mt-6 font-display text-5xl transition group-hover:text-gold-light md:text-6xl">{f.title}</h2>
              <p className="mt-6 max-w-md text-muted">{f.body}</p>
              <span className="mt-10 inline-block border-b border-gold/40 pb-1 text-sm text-gold transition group-hover:border-gold">Explore</span>
            </Link>
          </PanelReveal>
        ))}
      </section>
      <footer className="px-6 py-16 text-center text-xs text-muted md:px-16">
        Prices are estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon data from PokéAPI. Not affiliated with Nintendo, Creatures, or Game Freak.
      </footer>
    </main>
  );
}
