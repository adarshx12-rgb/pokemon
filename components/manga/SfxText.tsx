/** Decorative manga sound-effect lettering. Hidden from assistive tech. */
export function SfxText({ children, className = '', pop = false, delay }: { children: string; className?: string; pop?: boolean; delay?: number }) {
  return (
    <span aria-hidden className={`sfx ${pop ? 'sfx-pop' : ''} ${className}`} style={delay === undefined ? undefined : ({ '--sfx-delay': `${delay}s` } as React.CSSProperties)}>
      {children}
    </span>
  );
}
