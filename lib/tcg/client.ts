import { fetchWithRetry } from '@/lib/http';
import { normalizeCard } from './normalize';
import type { Card, RawCard } from './types';

const API = 'https://api.pokemontcg.io/v2';
const REVALIDATE = 86400;

function headers(): HeadersInit {
  const key = process.env.POKEMONTCG_API_KEY;
  return key ? { 'X-Api-Key': key } : {};
}

export async function getCard(id: string): Promise<Card | null> {
  const res = await fetchWithRetry(`${API}/cards/${encodeURIComponent(id)}`, { headers: headers(), next: { revalidate: REVALIDATE } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Pokémon TCG API returned ${res.status} for ${id}`);
  const json = (await res.json()) as { data: RawCard };
  return normalizeCard(json.data);
}

export async function getCards(ids: string[]): Promise<Card[]> {
  if (ids.length === 0) return [];
  const q = ids.map(id => `id:${id}`).join(' OR ');
  const res = await fetchWithRetry(`${API}/cards?q=${encodeURIComponent(q)}&pageSize=250`, { headers: headers(), next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`Pokémon TCG API returned ${res.status} for card list`);
  const json = (await res.json()) as { data: RawCard[] };
  return json.data.map(normalizeCard);
}
