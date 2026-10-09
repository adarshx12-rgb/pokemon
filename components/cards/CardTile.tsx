import Link from 'next/link';
import { TiltCard } from '@/components/TiltCard';
import { formatPrice } from '@/lib/tcg/normalize';
import type { Card } from '@/lib/tcg/types';

export function CardTile({ card }: { card: Card }) {
  const foil = card.tier === 'grail' || card.tier === 'ultra' || card.tier === 'holo';
  return (
    <Link href={`/cards/${card.id}`} data-testid="card-tile" className="group block">
      <TiltCard src={card.images.small} alt={`${card.name} — ${card.setName}`} width={245} height={342} foil={foil} sizes="(min-width: 1024px) 240px, 45vw" />
      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl leading-tight transition group-hover:text-gold-light">{card.name}</h3>
          <p className="truncate text-xs text-muted">{card.setName}, #{card.number}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] text-muted">Estimated</p>
          <p className="font-semibold text-gold-light">{card.price ? formatPrice(card.price) : '—'}</p>
        </div>
      </div>
    </Link>
  );
}
