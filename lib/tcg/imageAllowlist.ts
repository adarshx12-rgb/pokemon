import snapshot from '../../data/showcase-snapshot.json';

type RemotePattern = { protocol: 'https'; hostname: string; pathname: string };

/**
 * Exact card scans the image optimizer may fetch. Allowing all of images.pokemontcg.io would let anyone
 * spend the monthly Cloudflare Images transformation quota on cards the site never shows.
 * One pattern per set with a brace list of exact files (Next allows at most 50 patterns).
 * Regenerated with the snapshot (`npm run snapshot:showcase`), which holds every showcase card's URLs.
 */
export function cardImagePatterns(cards: { images: { small: string; large: string } }[] = snapshot): RemotePattern[] {
  const filesBySet = new Map<string, Set<string>>();
  for (const url of cards.flatMap(card => [card.images.small, card.images.large])) {
    const match = /^\/([A-Za-z0-9]+)\/([A-Za-z0-9_]+)\.png$/.exec(new URL(url).pathname);
    if (!match) throw new Error(`Unexpected card image path: ${url}`);
    const [, set, file] = match;
    filesBySet.set(set, (filesBySet.get(set) ?? new Set()).add(file));
  }
  return [...filesBySet].sort(([a], [b]) => a.localeCompare(b)).map(([set, files]) => {
    const names = [...files].sort();
    const file = names.length === 1 ? names[0] : `{${names.join(',')}}`;
    return { protocol: 'https', hostname: 'images.pokemontcg.io', pathname: `/${set}/${file}.png` };
  });
}
