import { writeFileSync } from 'node:fs';
import { SHOWCASE } from '../data/showcase';

// Historical identity data only. Prices still come from the existing market feed.
const SOURCE = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';
// This credit is absent from the dataset; verified against the printed card itself.
const CREDIT_OVERRIDES: Record<string, { artist: string; artistSource: string }> = {
  'sv8-238': { artist: 'GIDORA', artistSource: 'https://images.pokemontcg.io/sv8/238_hires.png' },
  'sv7-143': { artist: 'Orca', artistSource: 'https://images.pokemontcg.io/sv7/143_hires.png' },
  'sv7-148': { artist: 'Saboteri', artistSource: 'https://images.pokemontcg.io/sv7/148_hires.png' },
};
async function json(path: string) {
  const response = await fetch(`${SOURCE}/${path}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}
async function main() {
  const sets: { id: string; printedTotal: number }[] = await json('sets/en.json');
  const ids = [...new Set(SHOWCASE.map(card => card.id.split('-')[0]))];
  const rows = await Promise.all(ids.map(async id => {
    const cards: { id: string; artist?: string }[] = await json(`cards/en/${id}.json`);
    return cards.filter(card => SHOWCASE.some(item => item.id === card.id)).map(card => [card.id, {
      artist: card.artist ?? CREDIT_OVERRIDES[card.id]?.artist ?? null,
      ...(CREDIT_OVERRIDES[card.id] ? { artistSource: CREDIT_OVERRIDES[card.id].artistSource } : {}),
      printedTotal: sets.find(set => set.id === id)?.printedTotal ?? null,
      language: 'English',
    }] as const);
  }));
  const metadata = Object.fromEntries(rows.flat());
  if (Object.keys(metadata).length !== SHOWCASE.length) throw new Error('Incomplete metadata; existing file kept.');
  writeFileSync('data/collector-metadata.json', JSON.stringify(metadata, null, 2) + '\n');
  console.log(`Saved verified identity details for ${Object.keys(metadata).length} cards.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
