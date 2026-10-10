import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DECOR } from '../lib/manga/decor';

const SRC = join(process.cwd(), 'design-assets', 'decor');
const OUT = join(process.cwd(), 'public', 'decor');
mkdirSync(OUT, { recursive: true });

async function main() {
  for (const name of DECOR) {
    const src = join(SRC, `${name}.png`);
    if (!existsSync(src)) { console.log(`skip ${name} (no PNG)`); continue; }
    const info = await sharp(src).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(OUT, `${name}.webp`));
    console.log(`${name}.webp ${Math.round(info.size / 1024)} KB`);
  }
}

main();
