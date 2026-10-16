import Link from 'next/link';
import styles from './faq.module.css';

const recordSource = 'https://www.guinnessworldrecords.com/news/2026/2/logan-pauls-rare-pokemon-card-becomes-most-expensive-ever-sold-in-record-setting-auction';

export function Faq() {
  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-title">
      <header>
        <h2 id="faq-title">Good questions.<br />Closer looks.</h2>
        <p>Pokémon card rarity, prices, and the tools in your collection. Start here.</p>
      </header>
      <div className={styles.questions}>
        <details>
          <summary>What is the rarest Pokémon card?</summary>
          <div>
            <p>There is no single ranking that covers print runs, surviving copies, and condition. Pikachu Illustrator is one of the best-known exceptionally rare cards: it was awarded through an illustration contest rather than sold in regular booster packs. A record auction price makes a particular copy the most expensive, but does not prove that its printing has the fewest copies.</p>
            <p className={styles.source}>Read the <a href={recordSource}>Pikachu Illustrator record and history at Guinness World Records</a>.</p>
          </div>
        </details>
        <details>
          <summary>What are some of the most rare Pokémon cards?</summary>
          <div>
            <p>Examples include Pikachu Illustrator, early Japanese Pikachu trophy cards, and the 1998 Family Event Kangaskhan trophy card. These were special awards with limited distribution. They belong to a different collecting category from rare cards pulled from ordinary packs, and a numbered “top ten” changes depending on whether you compare distribution, known surviving copies, or sale prices.</p>
            <p className={styles.source}>Explore <a href="https://www.psacard.com/articles/articleview/9248/public/public/locales">PSA’s guide to Pokémon trophy cards</a>, or browse the <Link href="/cards">rare Pokémon cards in our vault</Link>.</p>
          </div>
        </details>
        <details>
          <summary>How do I tell if a Pokémon card is rare?</summary>
          <div>
            <p>Start with the rarity symbol near the card number and match the card to its exact set and language. On many English cards, a circle means common, a diamond means uncommon, and a star means rare. Newer sets use additional symbols: for example, Scarlet &amp; Violet introduced two black stars for double rare cards. Promos and other special releases can follow different conventions.</p>
            <p>Compare the number, artwork, and finish with the set’s official checklist. A shiny surface alone does not establish rarity or value; reverse-holo versions can have the same rarity symbol as their non-holo counterparts.</p>
            <p className={styles.source}>See the <a href="https://www.pokemon.com/us/pokemon-news/pokemon-tcg-scarlet-and-violet-revamps-pokemon-tcg-card-aesthetic">official Scarlet &amp; Violet rarity guide</a> and an <a href="https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/checklist/swsh11_web_cardlist_en.pdf">official card checklist with rarity symbols</a>.</p>
          </div>
        </details>
        <details>
          <summary>How much is the most expensive Pokémon card?</summary>
          <div>
            <p>Guinness World Records reported a sale of <strong>US$16,492,000</strong> for a PSA 10 Pikachu Illustrator on February 16, 2026. That total includes the auction buyer’s premium. It describes a particular graded copy and a dated sale, not a general price for every Illustrator card or other rare Pokémon cards.</p>
            <p className={styles.source}><a href={recordSource}>Read the dated auction record</a>. For everyday comparisons, check the printing, condition, currency, and date behind any estimate.</p>
          </div>
        </details>
        <details>
          <summary>Does a rare Pokémon card always have a high value?</summary>
          <div>
            <p>No. Catalog rarity and market value measure different things. Identify the exact printing and finish, then compare recent completed sales for copies in similar condition. A seller’s asking price is not proof that a card sold for that amount. New releases also need this same comparison; the year printed on a card is not enough to establish its value.</p>
            <p>Our <Link href="/cards">card pages</Link> show dated estimates where available, with the source and currency. They are references for raw, ungraded cards, not offers to buy or sell your copy.</p>
          </div>
        </details>
        <details>
          <summary>Where can I buy rare Pokémon cards?</summary>
          <div>
            <p>Individual cards are sold by card shops, specialist marketplaces, and auction houses. Compare seller history, buyer protection, return terms, and clear photos of the actual copy. For graded cards, check the certification with the grading company. Buying a sealed pack does not guarantee a particular rare card.</p>
            <p>For official sealed products, <a href="https://support.pokemon.com/hc/en-us/articles/360000634514-How-can-I-find-where-Pok%C3%A9mon-products-are-available-to-buy">Pokémon Support lists shopping options and a retail locator</a>. Pokéfame is a reference tool; we do not sell cards or arrange transactions.</p>
          </div>
        </details>
        <details>
          <summary>Is Pokéfame the same as Pokémon Showdown?</summary>
          <div>
            <p>No. Our <Link href="/showdown">Pokémon showdown tool</Link> is an independent, simplified battle simulator. You build two teams and control both sides in the same browser. It has no online matchmaking ladder and does not simulate items, abilities, weather, or status effects. It is separate from the Pokémon Showdown service.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
