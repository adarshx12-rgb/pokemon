import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DECOR, decorSrc } from './decor';

describe('decorSrc', () => {
  it('returns the public URL when the WebP exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'decor-'));
    mkdirSync(join(dir, 'decor'));
    writeFileSync(join(dir, 'decor', 'arena.webp'), '');
    expect(decorSrc('arena', dir)).toBe('/decor/arena.webp');
  });
  it('returns null when the file is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'decor-'));
    expect(decorSrc('arena', dir)).toBeNull();
  });
  it('lists the five spec assets', () => {
    expect(DECOR).toEqual(['hero-hand', 'vault-door', 'arena', 'vault-shelves', 'grail-spotlight']);
  });
});
