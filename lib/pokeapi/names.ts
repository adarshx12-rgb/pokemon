export function displayName(slug: string): string {
  return slug.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}
