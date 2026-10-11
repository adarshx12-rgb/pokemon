import manifest from './decor-manifest.json';

/** Optional Higgsfield illustrations in public/decor/. Panels must render fine without them. */
export const DECOR = ['vault-shelves', 'grail-spotlight'] as const;
export type DecorName = (typeof DECOR)[number];

/**
 * Public URL of a decor WebP, or null when it hasn't been generated yet. Availability comes from a
 * manifest written by scripts/compress-decor.ts, not a runtime fs check: serverless hosts don't
 * bundle public/ into functions, so an ISR re-render would silently lose the art.
 */
export function decorSrc(name: DecorName, available: readonly string[] = manifest): string | null {
  return available.includes(name) ? `/decor/${name}.webp` : null;
}
