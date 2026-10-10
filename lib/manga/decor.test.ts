import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from './decor-manifest.json';
import { DECOR, decorSrc } from './decor';

describe('decorSrc', () => {
  it('returns the public URL when the image is in the manifest', () => {
    expect(decorSrc('arena', ['arena'])).toBe('/decor/arena.webp');
  });
  it('returns null when the image is not in the manifest', () => {
    expect(decorSrc('arena', [])).toBeNull();
  });
  it('lists the five spec assets', () => {
    expect(DECOR).toEqual(['hero-hand', 'vault-door', 'arena', 'vault-shelves', 'grail-spotlight']);
  });
});

describe('decor-manifest.json', () => {
  // The manifest replaces a runtime fs check, which fails on serverless hosts where public/ isn't in the function bundle.
  it('matches the WebP files actually in public/decor', () => {
    const dir = join(process.cwd(), 'public', 'decor');
    const onDisk = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.webp')).map(f => f.replace(/\.webp$/, '')) : [];
    expect([...manifest].sort()).toEqual(onDisk.sort());
  });
});
