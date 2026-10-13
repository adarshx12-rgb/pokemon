import type { MetadataRoute } from 'next';
import { SHOWCASE } from '@/data/showcase';
import { SITE_URL } from '@/lib/seo';
import { SITE_PAGES } from '@/lib/site-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/cards', '/showdown', ...SITE_PAGES.map(page => page.href), ...SHOWCASE.map(card => `/cards/${card.id}`)]
    .map(path => ({ url: new URL(path, SITE_URL).href }));
}
