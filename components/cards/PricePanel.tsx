import { formatPrice, variantLabel } from '@/lib/tcg/normalize';
import type { Price } from '@/lib/tcg/types';
import { InkPanel } from '@/components/manga/InkPanel';
import { formatUpdated } from '@/lib/grail/format';

const Tone = () => <div aria-hidden className="screentone absolute inset-x-0 top-0 h-16" />;

export function PricePanel({ price }: { price: Price | null }) {
  if (!price) {
    return (
      <InkPanel className="p-8">
        <Tone />
        <p className="caption-box relative">Estimated value</p>
        <p className="relative mt-3 font-display text-4xl text-muted">Price unavailable</p>
        <p className="relative mt-2 text-sm text-muted">No recent market data for this card.</p>
      </InkPanel>
    );
  }
  const fmt = (n: number | null) => (n === null ? '—' : formatPrice({ ...price, market: n }));
  return (
    <InkPanel className="p-8">
      <Tone />
      <p className="caption-box relative">Estimated value · {price.currency}</p>
      <p className="relative mt-3 font-display text-5xl text-gold-gradient sm:text-6xl">{formatPrice(price)}</p>
      <p className="relative mt-3 text-sm text-cream">{price.variant ? `Price variant: ${variantLabel(price.variant)}` : 'Finish not specified by source'}</p>
      <dl className="relative mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-muted">Listed low</dt><dd className="text-cream">{fmt(price.low)}</dd></div>
        <div><dt className="text-muted">Listed high</dt><dd className="text-cream">{fmt(price.high)}</dd></div>
      </dl>
      <p className="relative mt-6 text-xs leading-relaxed text-muted">Source: {price.source}. Data dated {formatUpdated(price.updatedAt) ?? price.updatedAt}.</p>
      <p className="relative mt-3 text-xs leading-relaxed text-muted">Raw, ungraded estimate. Condition is not specified by the source. Listed low/high are asking prices, not a sold-price range. Match language, printing and condition before comparing.</p>
      <p className="relative mt-3 text-xs leading-relaxed text-muted">Individual sold listings, price history and graded prices are not available in this view.</p>
    </InkPanel>
  );
}
