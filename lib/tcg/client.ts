import { fetchWithRetry } from '@/lib/http';
import { normalizeCard } from './normalize';
import { SNAPSHOT } from './snapshot';
import type { Card, RawCard } from './types';

const API = 'https://api.pokemontcg.io/v2';
const REVALIDATE = 86400;

function headers(): HeadersInit {
  const key = process.env.POKEMONTCG_API_KEY;
  return key ? { 'X-Api-Key': key } : {};
}

/** Live API only — used by the scripts that verify and snapshot the showcase. */
export async function fetchRawCards(ids: string[]): Promise<RawCard[]> {
  if (ids.length === 0) return [];
  const q = ids.map(id => `id:${id}`).join(' OR ');
  const res = await fetchWithRetry(`${API}/cards?q=${encodeURIComponent(q)}&pageSize=250`, { headers: headers(), next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`Pokémon TCG API returned ${res.status} for card list`);
  return ((await res.json()) as { data: RawCard[] }).data;
}

// The public API has long bursts of 5xx errors; when retries run out, serve the committed snapshot.
// Its prices carry their own updatedAt date, so staleness stays visible.
function fromSnapshot(ids: string[], err: unknown): Card[] {
  const cards = SNAPSHOT.filter(c => ids.includes(c.id)).map(normalizeCard);
  if (cards.length === 0) throw err;
  console.warn(`Pokémon TCG API unavailable, serving ${cards.length} card(s) from snapshot:`, (err as Error).message);
  return cards;
}

const CARD_ID = /^[a-z0-9][a-z0-9.-]*$/i;

// Uses the search endpoint: the single-card endpoint answers 5xx for unknown ids, so "not found" can't be told apart from an outage.
export async function getCard(id: string): Promise<Card | null> {
  if (!CARD_ID.test(id)) return null;
  let raws: RawCard[];
  try {
    raws = await fetchRawCards([id]);
  } catch (err) {
    // Only showcase cards are linked, so an id the snapshot lacks is treated as not found.
    return SNAPSHOT.some(c => c.id === id) ? fromSnapshot([id], err)[0] : null;
  }
  const raw = raws.find(c => c.id === id);
  return raw ? normalizeCard(raw) : null;
}

export async function getCards(ids: string[]): Promise<Card[]> {
  try {
    return (await fetchRawCards(ids)).map(normalizeCard);
  } catch (err) {
    return fromSnapshot(ids, err);
  }
}
