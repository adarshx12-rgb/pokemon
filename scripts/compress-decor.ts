import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DECOR } from '../lib/manga/decor';

const SRC = join(process.cwd(), 'design-assets', 'decor');
const OUT = join(process.cwd(), 'public', 'decor');
mkdirSync(OUT, { recursive: true });

/** Widest each image is ever shown (CSS px × 2 for retina, capped); the hero inset is small. */
const MAX_WIDTH: Record<(typeof DECOR)[number], number> = {
  'vault-shelves': 1920, 'grail-spotlight': 1600,
};

async function main() {
  for (const name of DECOR) {
    const src = join(SRC, `${name}.png`);
    if (!existsSync(src)) { console.log(`skip ${name} (no PNG)`); continue; }
    const info = await sharp(src).resize({ width: MAX_WIDTH[name], withoutEnlargement: true }).webp({ quality: 70 }).toFile(join(OUT, `${name}.webp`));
    console.log(`${name}.webp ${Math.round(info.size / 1024)} KB`);
  }
  // decorSrc() reads this manifest instead of checking public/ at runtime.
  const available = DECOR.filter(name => existsSync(join(OUT, `${name}.webp`)));
  writeFileSync(join(process.cwd(), 'lib', 'manga', 'decor-manifest.json'), `${JSON.stringify(available)}
`);
}

main();
