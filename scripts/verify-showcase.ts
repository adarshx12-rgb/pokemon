import { SHOWCASE } from '../data/showcase';
import { getCards } from '../lib/tcg/client';

async function main() {
  const cards = await getCards(SHOWCASE.map(s => s.id));
  const found = new Map(cards.map(c => [c.id, c]));
  let problems = 0;
  for (const { id } of SHOWCASE) {
    const c = found.get(id);
    if (!c) { console.log(`MISSING   ${id}`); problems++; continue; }
    if (!c.price) { console.log(`NO PRICE  ${id} (${c.name})`); problems++; continue; }
    console.log(`ok        ${id.padEnd(14)} ${c.tier.padEnd(9)} ${c.name} — ${c.price.market} ${c.price.currency}`);
  }
  console.log(problems ? `\n${problems} problem(s): remove or replace these IDs in data/showcase.ts.` : '\nAll showcase cards verified.');
  process.exitCode = problems ? 1 : 0;
}

main();
