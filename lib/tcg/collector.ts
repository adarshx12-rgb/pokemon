import metadata from '@/data/collector-metadata.json';
import { COLLECTOR_NOTES } from '@/data/collectorNotes';
import type { Card } from './types';

const identities: Record<string, { artist: string | null; artistSource?: string; printedTotal: number | null; language: string }> = metadata;

export function collectorInfo(card: Card) {
  const identity = identities[card.id];
  return {
    artist: identity?.artist ?? null,
    artistSource: identity?.artistSource ?? null,
    language: identity?.language ?? 'Not recorded',
    number: identity?.printedTotal ? `${card.number}/${identity.printedTotal}` : card.number,
    source: `https://github.com/PokemonTCG/pokemon-tcg-data/blob/master/cards/en/${card.id.split('-')[0]}.json`,
    note: COLLECTOR_NOTES[card.id] ?? {
      appeal: `A ${card.name} from ${card.setName}, for a favourite-Pokémon collection or set checklist.`,
      check: 'Match the set, collector number, language and finish, then inspect the condition of the actual copy.',
      collect: 'Compare other prints of this Pokémon, or track the cards you are missing from its set.',
    },
  };
}
