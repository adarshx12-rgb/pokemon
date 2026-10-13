import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Named groups replace the `*` group for that crawler, so each one repeats the same rules.
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent', 'Bytespider', 'cohere-ai',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: '/api/' },
    ],
    sitemap: new URL('/sitemap.xml', SITE_URL).href,
  };
}
