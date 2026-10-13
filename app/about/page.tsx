import Link from 'next/link';
import { InfoPage } from '@/components/info/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({ title: 'About Us — Cards, Collecting & Battles', description: 'Learn about pokefame, an independent Pokémon card reference and browser battle tool, including our card sources, editorial tiers, and price estimates.', path: '/about' });

export default function AboutPage() {
  return (
    <InfoPage title="About us" intro="A place to look closer at Pokémon cards, and spend a little more time with your favorites.">
      <section>
        <h2>Built around discovery</h2>
        <p>pokefame brings two ways of enjoying Pokémon together: a curated card vault and an interactive battle tool. The collection puts artwork, card identity, and collector context in view. The arena lets you build two teams and choose their moves in a simplified browser battle.</p>
        <p>There is no shop, account subscription, or marketplace checkout here. You can browse the <Link href="/cards">Pokémon card vault</Link>, save owned and wanted marks in your browser, or head straight to a <Link href="/showdown">Pokémon showdown</Link>.</p>
      </section>
      <section>
        <h2>How the vault is organized</h2>
        <p>Our six tiers are editorial groups for exploring the featured collection. They are not official rarity classifications or a claim that we cover every card ever printed. A card’s catalog rarity, set, number, and available collector notes appear on its individual page.</p>
        <p>The homepage’s Rayquaza is a featured collector favorite. Its placement is an editorial choice, not a declaration that it is the rarest or most expensive Pokémon card in existence.</p>
      </section>
      <section>
        <h2>Sources, prices, and limitations</h2>
        <p>Card records come from the <a href="https://pokemontcg.io/">Pokémon TCG API</a>. Available price estimates are attributed to TCGplayer or Cardmarket, with the currency, variant, and source date shown. When live card data is unavailable, the site can show a saved reference snapshot; always read the displayed date.</p>
        <p>Prices refer to raw, ungraded cards and are not offers, appraisals, or guarantees. Catalog images cannot establish the condition or authenticity of a physical copy. Pokémon stats, moves, and battle artwork come from <a href="https://pokeapi.co/">PokéAPI</a>.</p>
      </section>
      <section>
        <h2>A small, independent arena</h2>
        <p>The battle tool is designed for exploring teams and basic type matchups. You control both sides locally, with no online matchmaking. Items, abilities, weather, and status effects are outside its simplified rules. pokefame is separate from the Pokémon Showdown service.</p>
      </section>
      <section>
        <h2>Corrections and credits</h2>
        <p>If a card detail, source link, or explanation needs correcting, please <Link href="/contact">contact us</Link> with the page address and a reliable reference. Questions about privacy or rights in artwork can go through the same contact page.</p>
        <p>pokefame is an independent fan project. Pokémon and related names, characters, card designs, and artwork belong to their respective owners. We are not affiliated with or endorsed by Nintendo, Creatures, Game Freak, or The Pokémon Company.</p>
      </section>
    </InfoPage>
  );
}
