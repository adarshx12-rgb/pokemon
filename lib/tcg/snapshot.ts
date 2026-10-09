import snapshot from '@/data/showcase-snapshot.json';
import type { RawCard } from './types';

/** Last known API data for the showcase cards, written by `npm run snapshot:showcase`. */
export const SNAPSHOT = snapshot as unknown as RawCard[];
