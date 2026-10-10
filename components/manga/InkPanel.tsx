import { RECT, clipPolygon, svgPoints, type Shape } from '@/lib/manga/panel';

interface Props {
  shape?: Shape;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: 'div' | 'section' | 'article';
}

/** A manga panel: clipped to `shape`, with a brush-inked cream border over a gold inner band. */
export function InkPanel({ shape = RECT, className = '', style, children, as: Tag = 'div' }: Props) {
  const points = svgPoints(shape);
  return (
    <Tag data-ink-panel className={`relative overflow-hidden bg-ink/80 ${className}`} style={{ ...style, clipPath: clipPolygon(shape) }}>
      {children}
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full [filter:url(#ink-rough)]" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Strokes are centred on the clip edge, so only the inner half shows: 6px gold band under a 3px cream line. */}
        <polygon data-ink-stroke points={points} pathLength={1} strokeDasharray={1} fill="none" stroke="var(--color-gold)" strokeOpacity={0.5} strokeWidth={12} vectorEffect="non-scaling-stroke" />
        <polygon data-ink-stroke points={points} pathLength={1} strokeDasharray={1} fill="none" stroke="var(--color-cream)" strokeWidth={6} vectorEffect="non-scaling-stroke" />
      </svg>
    </Tag>
  );
}
