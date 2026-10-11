/** "2026/10/09" (Pokémon TCG API) → "Oct 9, 2026". */
export function formatUpdated(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  const date = new Date(`${updatedAt.replace(/\//g, '-')}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export const priceCaption = (price: string | null): string => price ?? 'Unpriced';
