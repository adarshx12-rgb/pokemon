import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { FACE_SIZE } from '../lib/grail/assets';

// Sources are git-ignored: front = official scan upscaled 4K by Higgsfield (no redraw), rounded;
// back = Higgsfield GPT Image 2.5 black glass with a gold border, rounded. See the spec, section 5.
const SRC = join(process.cwd(), 'design-assets', 'grail');
const OUT = join(process.cwd(), 'public', 'grail');
const FACES = { front: 'front-rounded.png', back: 'back-rounded.png' } as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const [face, file] of Object.entries(FACES)) {
    const src = join(SRC, file);
    if (!existsSync(src)) throw new Error(`Missing ${src}. It is produced in the design pass (see spec section 5).`);
    const out = join(OUT, `rayquaza-${face}-${FACE_SIZE.width}.webp`);
    // next/image re-encodes at quality 75 per requested width, so keep the source near-lossless.
    const info = await sharp(src)
      .resize({ width: FACE_SIZE.width, height: FACE_SIZE.height, fit: 'fill' })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(out);
    console.log(`${out} ${Math.round(info.size / 1024)} KB`);
  }
}

main();
