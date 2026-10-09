export function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[.'’]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function displayName(slug: string): string {
  return slug.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

export function idFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
}
