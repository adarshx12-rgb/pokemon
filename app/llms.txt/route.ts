import { SHOWCASE } from '@/data/showcase';
import { HOME_DESCRIPTION, SITE_URL } from '@/lib/seo';
import { SITE_PAGES } from '@/lib/site-pages';
import { getCards } from '@/lib/tcg/client';

export const revalidate = 86400;

const url = (path: string) => new URL(path, SITE_URL).href;

// llms.txt (https://llmstxt.org): a Markdown map of the site for language-model crawlers.
export async function GET() {
  const cards = await getCards(SHOWCASE.map(s => s.id));
  const body = `# POKEFAME

> ${HOME_DESCRIPTION}

pokefame is an independent fan project with two parts: a curated vault of Pokémon trading cards and a simplified, local Pokémon battle simulator. Card data comes from the Pokémon TCG API; price estimates are attributed to TCGplayer or Cardmarket, refer to raw ungraded cards, and carry a source date. Vault tiers are editorial groupings, not official rarity rankings. Pokémon stats and moves come from PokéAPI. Not affiliated with Nintendo, Creatures, Game Freak, or The Pokémon Company, and separate from the Pokémon Showdown service.

## Main pages

- [Home](${url('/')}): Featured grail card (Rayquaza, EX Deoxys) and a field guide to collecting and battling
- [The Vault](${url('/cards')}): ${cards.length} featured Pokémon cards in six editorial tiers with artwork, set details, and dated price estimates
- [Showdown](${url('/showdown')}): Build two teams of up to six Pokémon, choose every move, and play both sides in the browser

## Cards

${cards.map(card => `- [${card.name} #${card.number} — ${card.setName}](${url(`/cards/${card.id}`)}): ${[card.rarity, card.releaseDate.slice(0, 4)].filter(Boolean).join(', ')}`).join('\n')}

## Optional

${SITE_PAGES.map(page => `- [${page.label}](${url(page.href)})`).join('\n')}
- [Sitemap](${url('/sitemap.xml')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
