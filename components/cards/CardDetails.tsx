import { TIER_META } from '@/data/rarity';
import { collectorInfo } from '@/lib/tcg/collector';
import { formatUpdated } from '@/lib/grail/format';
import type { Card } from '@/lib/tcg/types';
import { CollectorNotes } from './CollectorNotes';
import { CollectionControls } from './CollectionControls';
import { PricePanel } from './PricePanel';
import styles from './collector.module.css';

export function CardDetails({ card, headingId, modal = false }: { card: Card; headingId?: string; modal?: boolean }) {
  const info = collectorInfo(card);
  const Heading = modal ? 'h2' : 'h1';
  return (
    <>
      <header className={styles.detailHeader}>
        <p className={styles.edition}>{card.setName} · {card.releaseDate.slice(0, 4)}</p>
        <Heading id={headingId} className={styles.cardTitle}>{card.name}</Heading>
        <p className={styles.identity}>#{info.number} · {info.language}</p>
        <dl className={styles.facts}>
          <div><dt>Catalog rarity</dt><dd>{card.rarity ?? 'Not recorded'}</dd></div>
          <div><dt>Vault’s curated tier</dt><dd>{TIER_META[card.tier].label}</dd></div>
          <div><dt>Illustrator</dt><dd>{info.artist ?? 'Not recorded'}</dd></div>
          <div><dt>Released</dt><dd>{formatUpdated(card.releaseDate) ?? card.releaseDate}</dd></div>
        </dl>
        <p className={styles.finePrint}>Vault tiers are our editorial groupings. Catalog rarity is recorded separately.</p>
      </header>
      <CollectionControls id={card.id} />
      <CollectorNotes card={card} />
      <PricePanel price={card.price} />
      <section className={styles.copyCondition}>
        <h3>About the copy you buy</h3>
        <p>This is a card reference, not a listing for an individual copy. The artwork does not establish condition or authenticity. Ask for clear front, back and angled surface photos.</p>
        <p>Raw means professionally ungraded. For a graded card, match the grading company and grade, and check its certification record with that company before comparing prices.</p>
        <div className={styles.sourceLinks}>
          <a href={info.source} target="_blank" rel="noreferrer">Card data source ↗</a>
          {info.artistSource && <a href={info.artistSource} target="_blank" rel="noreferrer">Printed illustrator credit ↗</a>}
          <a href="https://www.psacard.com/gradingstandards" target="_blank" rel="noreferrer">Condition & grading guide ↗</a>
        </div>
      </section>
    </>
  );
}
