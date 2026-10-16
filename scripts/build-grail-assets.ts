import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { FACE_SIZE } from '../lib/grail/assets';

// Sources are git-ignored: front = official scan upscaled 4K by Higgsfield (no redraw), rounded;
// back = Higgsfield GPT Image 2.5 black glass with a gold border, rounded. See the spec, section 5.
const SRC = join(process.cwd(), 'design-assets', 'grail');
const OUT = join(process.cwd(), 'public', 'grail');
const FACES = { front: 'front-rounded.png', back: 'back-rounded.png' } as const;
const OG_FACE_WIDTH = 400;
const OG_OUT = join(process.cwd(), 'app', 'social-image');

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
    // The social image is drawn by next/og (Satori), which cannot decode WebP, so it gets a small PNG.
    const og = join(OG_OUT, `rayquaza-${face}-${OG_FACE_WIDTH}.png`);
    const ogInfo = await sharp(src)
      .resize({ width: OG_FACE_WIDTH, height: Math.round((OG_FACE_WIDTH * FACE_SIZE.height) / FACE_SIZE.width), fit: 'fill' })
      .png({ compressionLevel: 9, palette: false })
      .toFile(og);
    console.log(`${og} ${Math.round(ogInfo.size / 1024)} KB`);
  }
}

main();
