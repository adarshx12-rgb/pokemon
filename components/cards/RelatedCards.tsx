import Image from 'next/image';
import Link from 'next/link';
import { TIER_META } from '@/data/rarity';
import { formatPrice } from '@/lib/tcg/normalize';
import { speciesName, type RelatedGroup } from '@/lib/tcg/related';
import type { Card } from '@/lib/tcg/types';

function groupTitle(group: RelatedGroup, card: Card) {
  if (group.kind === 'species') return <>More <span className="text-gold-gradient emph">{speciesName(card.name)}</span> cards</>;
  if (group.kind === 'set') return <>More from <span className="text-gold-gradient emph">{card.setName}</span></>;
  return <>More <span className="text-gold-gradient emph">{TIER_META[card.tier].label}</span> tier cards</>;
}

export function RelatedCards({ card, groups }: { card: Card; groups: RelatedGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="mt-24 space-y-16">
      {groups.map(group => (
        <section key={group.kind} aria-labelledby={`related-${group.kind}`}>
          <h2 id={`related-${group.kind}`} className="font-display text-4xl">{groupTitle(group, card)}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {group.cards.map((c, i) => (
              <li key={c.id} className={`min-w-0 ${i >= 4 ? 'max-sm:hidden' : ''}`}>
                <Link href={`/cards/${c.id}`} prefetch={false} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo">
                  <Image src={c.images.small} alt={`${c.name} — ${c.setName}`} width={245} height={342} sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw" className="h-auto w-full rounded-[4.5%] transition duration-500 group-hover:scale-[1.03]" />
                  <p className="mt-3 font-display text-lg leading-tight transition group-hover:text-gold-light">{c.name}</p>
                  <p className="truncate text-xs text-muted">{c.setName}, #{c.number}</p>
                  {c.price && <p className="mt-1 text-sm font-bold text-gold-light">{formatPrice(c.price)}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
