'use client';

export function GlitterCanvas({ className }: { className?: string }) {
  return <canvas aria-hidden data-glitter className={className} />;
}
