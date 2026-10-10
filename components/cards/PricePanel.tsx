import { formatPrice, variantLabel } from '@/lib/tcg/normalize';
import type { Price } from '@/lib/tcg/types';

export function PricePanel({ price }: { price: Price | null }) {
  if (!price) {
    return (
      <div className="border-gold-frame rounded-2xl bg-surface p-8">
        <p className="eyebrow">Estimated value</p>
        <p className="mt-3 font-display text-4xl text-muted">Price unavailable</p>
        <p className="mt-2 text-sm text-muted">No recent market data for this card.</p>
      </div>
    );
  }
  const fmt = (n: number | null) => (n === null ? '—' : formatPrice({ ...price, market: n }));
  return (
    <div className="border-gold-frame rounded-2xl bg-surface p-8">
      <p className="eyebrow">Estimated value, {variantLabel(price.variant)}</p>
      <p className="mt-3 font-display text-6xl text-gold-gradient">{formatPrice(price)}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-muted">Low</dt><dd className="text-cream">{fmt(price.low)}</dd></div>
        <div><dt className="text-muted">High</dt><dd className="text-cream">{fmt(price.high)}</dd></div>
      </dl>
      <p className="mt-6 text-xs text-muted">Source: {price.source}. Updated {price.updatedAt}.</p>
    </div>
  );
}
