import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { FACE_SIZE, GRAIL_FACES } from './assets';

describe('grail card faces', () => {
  for (const face of ['front', 'back'] as const) {
    it(`${face} WebP exists at the declared size, with transparent corners`, async () => {
      const file = join(process.cwd(), 'public', GRAIL_FACES[face]);
      expect(existsSync(file)).toBe(true);
      const meta = await sharp(file).metadata();
      expect(meta.width).toBe(FACE_SIZE.width);
      expect(meta.height).toBe(FACE_SIZE.height);
      expect(meta.hasAlpha).toBe(true);
      const corner = await sharp(file).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
      expect(corner[3]).toBe(0); // alpha of the top-left pixel: rounded corner is see-through
    });
  }
});
