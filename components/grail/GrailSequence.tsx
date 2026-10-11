'use client';
import { useRef } from 'react';
import { GRAIL } from '@/data/showcase';
import { formatUpdated, priceCaption } from '@/lib/grail/format';
import { Doors } from './Doors';
import { GlitterCanvas } from './GlitterCanvas';
import { GrailCard } from './GrailCard';
import styles from './grail.module.css';

export interface GrailSequenceProps {
  price: string | null;
  priceSource: string | null;
  updatedAt: string | null;
  tierCount: number;
  cardCount: number;
}

const DESCRIPTION =
  'A vault of rare Pokémon cards, from Base Set holos to Gold Stars. Every card is ranked into six tiers of rarity and priced daily from TCGplayer and Cardmarket. Open the vault to browse them, or take a team of six into Showdown.';
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The home page: welcome → grail card → doors. Server-rendered as three stacked screens; on capable
 * clients the effect (Task 8) pins them into one scroll-driven stage.
 */
export function GrailSequence({ price, priceSource, updatedAt, tierCount, cardCount }: GrailSequenceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const updated = formatUpdated(updatedAt);

  return (
    <section ref={rootRef} className={styles.root} aria-label="Pokémon Vault">
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.welcome} data-part="welcome">
          <div className={`meta ${styles.metaRow}`}>
            <span>Ed. 01 — The collector’s index</span>
            <span>Rare cards · ranked · priced daily</span>
          </div>
          <h1 className={`grain ${styles.siteName}`}>Pokémon <br className="md:hidden" />Vault</h1>
          <p className={styles.subhead}>Rare by design /<br />priced by the market</p>
          <div className={styles.intro}>
            <p className="copy">{DESCRIPTION}</p>
            <a href="#grail" className="text-link" data-goto="0.25">Scroll to open the vault ↓</a>
          </div>
          <ul className={`meta ${styles.facts}`}>
            <li><span className="text-red">{pad2(tierCount)}</span> tiers</li>
            <li><span className="text-red">{cardCount}</span> cards on file</li>
            {updated && <li>Prices updated {updated}</li>}
            <li><span className="text-gold">Grail</span> inside ↓</li>
          </ul>
          <span className={`meta ${styles.vlabel}`} aria-hidden>Independent collector’s index</span>
        </div>

        <div id="grail" className={styles.grail}>
          <div className={`meta ${styles.metaRow}`} data-part="grailMeta">
            <span>No. 001 — The rarest card in the vault</span>
            <span>{GRAIL.setName} · {GRAIL.year} · {GRAIL.number}</span>
          </div>
          <h2 className={`grain ${styles.cardName}`} data-part="headline">{GRAIL.name}</h2>
          <div className={styles.cardHome} data-card-home><GrailCard /></div>
          <div className={styles.grailCopy} data-part="grailCopy">
            <p className={styles.kicker}>Gold Star /<br />one of the rarest</p>
            <p className="copy">A shiny Rayquaza marked with a gold star, the rarest print in its set. Kept in tier 01 of the vault.</p>
            <a href="#doors" className="text-link" data-goto="0.74">Scroll to turn the card ↓</a>
          </div>
          {price && (
            <div className={styles.price} data-part="price">
              <p className="meta text-gold">Est. market — {priceSource}</p>
              <p className={`text-gold-gradient ${styles.priceValue}`}>{price}</p>
            </div>
          )}
          <span className={`meta ${styles.vlabel}`} data-part="grailLabel" aria-hidden>Tier 01 — The Grail</span>
          <ol className={styles.captions}>
            <li className={styles.caption} data-caption="0">
              <p className="meta">01 / The card</p>
              <p className={styles.captionTitle}>{GRAIL.name}</p>
              <p className="meta text-gold">{GRAIL.setName} · {GRAIL.number}</p>
            </li>
            <li className={styles.caption} data-caption="1">
              <p className="meta">02 / The print</p>
              <p className={styles.captionTitle}>Shiny<br />Gold<br />Star</p>
              <p className="meta text-gold">Released {GRAIL.year}</p>
            </li>
            <li className={styles.caption} data-caption="2">
              <p className="meta">03 / The price</p>
              <p className={`text-gold-gradient ${styles.captionTitle}`}>{priceCaption(price)}</p>
              {priceSource && <p className="meta text-gold">Est. market — {priceSource}</p>}
            </li>
          </ol>
          <div className={styles.rule} data-part="rule" aria-hidden><div className={styles.ruleFill} data-part="ruleFill" /></div>
        </div>

        <div id="doors" className={styles.doors} data-part="doors">
          <div className={styles.doorsLayout}>
            <div data-part="doorsTitle">
              <p className="meta">Contents — Ed. 01</p>
              <h2 className={styles.chooseTitle}>Choose<br />your<br />door.</h2>
              <p className="copy max-w-[300px]">The grail goes back in the vault. Follow it in, or take a team to the arena.</p>
            </div>
            <Doors />
          </div>
        </div>

        <GlitterCanvas className={styles.glitter} />
      </div>
    </section>
  );
}
