import Link from 'next/link';
import { GRAIL } from '@/data/showcase';
import styles from './field-guide.module.css';

const chapters = [
  ['pokemon-cards', 'Explore the cards'],
  ['rare-pokemon-cards', 'Understand rare finds'],
  ['card-prices', 'Read the price'],
  ['your-collection', 'Keep a collection'],
  ['pokemon-showdown', 'Build a showdown'],
  ['battle-matchups', 'Learn the matchup'],
] as const;

export function FieldGuide() {
  return (
    <section className={styles.guide} aria-labelledby="field-guide-title" id="field-guide">
      <header className={styles.header}>
        <h2 id="field-guide-title">Pokémon cards.<br />A world to explore.</h2>
        <p>From the card you remember to the team you have yet to try. A field guide to collecting and playing with POKEFAME.</p>
      </header>
      <div className={styles.layout}>
        <nav className={`meta ${styles.contents}`} aria-label="Collector and battle guide">
          <p>Inside the guide</p>
          {chapters.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          <Link href="/cards" className={styles.destination}>Browse Pokémon cards ↗</Link>
          <Link href="/showdown" className={styles.destination}>Play a Pokémon showdown ↗</Link>
        </nav>
        <div className={styles.chapters}>
          <section id="pokemon-cards">
            <h3>Pokémon cards, with the details in view</h3>
            <p>Every collection begins with something that catches your eye. It might be a familiar Pokémon, a striking illustration, or a card you remember pulling years ago. pokefame brings those discoveries into a visual card vault, alongside a browser battle tool for trying your favorite creatures in action. You can explore Pokémon cards, read about individual printings, and then build a team for a different kind of encounter. Start with whichever side of Pokémon you enjoy most.</p>
            <p>The <Link href="/cards">Pokémon card vault</Link> is a curated selection rather than a complete checklist of every release. Open a card to see its artwork, set, card number, recorded rarity, and available collector notes. Those details help distinguish cards that share a character but belong to different releases. Follow the dedicated card link when you want a page to bookmark or share. Looking closely at one printing is often more useful than comparing several cards by name alone.</p>
          </section>
          <section id="rare-pokemon-cards">
            <h3>What makes rare Pokémon cards worth a closer look?</h3>
            <p>Rare Pokémon cards can attract attention for different reasons: an unusual illustration, a distinctive treatment, a memorable set, or a Pokémon with a devoted following. The vault gives you room to inspect those differences. Its six editorial tiers run from common and uncommon through rare, holo, ultra, and grail. These are browsing groups chosen for this collection; each card’s catalog rarity is shown separately, so the two descriptions do not get confused.</p>
            <p>The homepage spotlights <Link href={`/cards/${GRAIL.id}`}>Rayquaza from EX Deoxys</Link>, a starting point for exploring the collection’s Gold Star era. From there, compare vintage favorites with newer illustration cards and other featured releases. A grail is a personal collecting goal as much as a label. You might care most about one artist, one species, or completing a particular set. Use the artwork and notes to discover what interests you, instead of letting a tier decide your entire wishlist.</p>
          </section>
          <section id="card-prices">
            <h3>Read the card price, then read the context</h3>
            <p>A number becomes more useful when you know what it describes. Where pricing is available, pokefame shows a market estimate with its source, currency, variant, and update date. The card data comes through the Pokémon TCG API, with estimates sourced from TCGplayer or Cardmarket. Check that date before making comparisons: the displayed figure is a dated reference, not a live offer or a promise that a seller will accept that amount.</p>
            <p>Compare the same printing and finish whenever possible. A raw card and a professionally graded copy are different comparisons, and the condition of an individual card cannot be established from catalog artwork. The vault’s estimates refer to raw, ungraded cards. For a copy you are considering, inspect the seller’s photos and description as well as the card identity. If a price is unavailable, the artwork and collector information still give you a useful place to begin your research.</p>
          </section>
          <section id="your-collection">
            <h3>A collection that follows your interests</h3>
            <p>Use the card controls to mark what you own and what you would like to find. A card can be both owned and wanted, which is useful when you are looking for another copy. These choices are saved in the browser you are using. They do not require an account, but they also do not automatically travel to another device. Clearing site storage can remove those saved marks.</p>
            <p>A focused collection is easier to explore than an endless shopping list. Try following a favorite Pokémon across sets, comparing the work of an illustrator, or revisiting the artwork from a childhood release. Open the collector notes and check the printed identity before adding a card to your plans. pokefame is a reference and discovery tool, so browsing does not reserve a card or place an order. You can take your time and return to the details that matter to you.</p>
          </section>
          <section id="pokemon-showdown">
            <h3>Build your own Pokémon showdown</h3>
            <p>When you want to move from collecting to playing, open the <Link href="/showdown">Pokémon showdown battle tool</Link>. Search for Pokémon and add between one and six to each team. Choose supported moves, arrange the team order, and put your intended lead in the first slot. You can build the opposing team yourself or use its randomize control for a fresh matchup. Switch between HD artwork and classic sprites to choose the look you prefer.</p>
            <p>This is pokefame’s own simplified, local battle simulator, separate from the Pokémon Showdown service. You control both teams in the same browser rather than joining an online matchmaking ladder. Select Fight, then choose an attack for the highlighted Pokémon. Each attack waits for your input, so you can pause to consider the available moves. When a Pokémon faints, the next member in its lineup enters; the last team with a Pokémon standing wins.</p>
          </section>
          <section id="battle-matchups">
            <h3>Learn a matchup, one move at a time</h3>
            <p>The battle tool makes a few core relationships easier to see. Speed helps determine move order, while offensive stats, defensive stats, and type matchups influence damage. Every Pokémon battles at level 50 with the same IV, EV, and nature settings. The move menus draw from the species’ recorded learnsets and include supported damaging attacks. Try a different lead or moveset and watch how the same two teams can create a different encounter.</p>
            <p>The rules stay deliberately compact: held items, abilities, weather, and status effects are not simulated. Accuracy, critical hits, and damage rolls can still change a rematch. Use the experience to explore basic decisions rather than predict a full competitive ruleset. Whether you arrived for rare Pokémon cards or a quick Pokémon battle, the next step is simple: inspect a card that interests you, or choose a team and see what happens when your favorites meet.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
