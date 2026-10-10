import Link from 'next/link';
import { TiltCard } from '@/components/TiltCard';
import { InkPanel } from '@/components/manga/InkPanel';
import { SpeechBubble } from '@/components/manga/SpeechBubble';
import { formatPrice } from '@/lib/tcg/normalize';
import type { Card } from '@/lib/tcg/types';

export function CardTile({ card, splash = false }: { card: Card; splash?: boolean }) {
  const foil = card.tier === 'grail' || card.tier === 'ultra' || card.tier === 'holo';
  return (
    <Link href={`/cards/${card.id}`} data-testid="card-tile" data-splash={splash || undefined} className={`group block ${splash ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
      <InkPanel className="h-full p-4">
        <div aria-hidden className="speed-lines absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
        <div className={`relative transition duration-500 group-hover:scale-[1.03] ${splash ? 'mx-auto max-w-sm' : ''}`}>
          <TiltCard src={splash ? card.images.large : card.images.small} alt={`${card.name} — ${card.setName}`} width={splash ? 734 : 245} height={splash ? 1024 : 342} foil={foil} sizes={splash ? '(min-width: 1024px) 384px, 90vw' : '(min-width: 1024px) 240px, 45vw'} />
          {splash && card.price && (
            <SpeechBubble tail="bottom" className="absolute -top-2 right-0 text-sm max-sm:hidden">{formatPrice(card.price)}</SpeechBubble>
          )}
        </div>
        <div className="relative mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className={`font-display leading-tight transition group-hover:text-gold-light ${splash ? 'text-lg sm:text-3xl' : 'text-lg'}`}>{card.name}</h3>
            <p className="truncate text-xs text-muted">{card.setName}, #{card.number}</p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] text-muted">Estimated</p>
            <p className="font-bold text-gold-light">{card.price ? formatPrice(card.price) : '—'}</p>
          </div>
        </div>
      </InkPanel>
    </Link>
  );
}
