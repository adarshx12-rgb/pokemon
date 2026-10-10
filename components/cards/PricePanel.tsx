import { formatPrice, variantLabel } from '@/lib/tcg/normalize';
import type { Price } from '@/lib/tcg/types';
import { InkPanel } from '@/components/manga/InkPanel';

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
      <p className="caption-box relative">Estimated value, {variantLabel(price.variant)}</p>
      <p className="relative mt-3 font-display text-6xl text-gold-gradient">{formatPrice(price)}</p>
      <dl className="relative mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-muted">Low</dt><dd className="text-cream">{fmt(price.low)}</dd></div>
        <div><dt className="text-muted">High</dt><dd className="text-cream">{fmt(price.high)}</dd></div>
      </dl>
      <p className="relative mt-6 text-xs text-muted">Source: {price.source}. Updated {price.updatedAt}.</p>
    </InkPanel>
  );
}
