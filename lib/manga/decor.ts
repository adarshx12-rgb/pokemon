import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Optional Higgsfield illustrations in public/decor/. Panels must render fine without them. */
export const DECOR = ['hero-hand', 'vault-door', 'arena', 'vault-shelves', 'grail-spotlight'] as const;
export type DecorName = (typeof DECOR)[number];

/** Public URL of a decor WebP, or null when it hasn't been generated yet. Server-only. */
export function decorSrc(name: DecorName, publicDir = join(process.cwd(), 'public')): string | null {
  return existsSync(join(publicDir, 'decor', `${name}.webp`)) ? `/decor/${name}.webp` : null;
}
