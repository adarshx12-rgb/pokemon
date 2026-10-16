// Wraps the worker that `opennextjs-cloudflare build` generates (wrangler.jsonc points here).
// Generated at build time, so it may be missing when type-checking; ts-expect-error would fail once it exists.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as handler } from './.open-next/worker.js';

type Ctx = { waitUntil(promise: Promise<unknown>): void };
type Worker = { fetch(request: Request, env: unknown, ctx: Ctx): Promise<Response> };

const next = handler as Worker;
const IMAGE_PATH = '/_next/image';
// Optimized card scans never change for a given URL, so let browsers and the edge keep them.
const IMAGE_CACHE_CONTROL = 'public, max-age=2592000, s-maxage=31536000, immutable';

/**
 * The adapter only marks an optimized image cacheable when the source says it is immutable, and
 * images.pokemontcg.io does not, so every request re-fetched and re-transformed the scan (~1 s).
 * Keep each result in the colo's edge cache, keyed by the format the client accepts.
 */
async function cachedImage(request: Request, env: unknown, ctx: Ctx): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new URL(request.url);
  key.searchParams.set('fmt', (request.headers.get('Accept') ?? '').includes('image/webp') ? 'webp' : 'orig');
  const cacheKey = new Request(key.href);

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const response = await next.fetch(request, env, ctx);
  if (response.status !== 200) return response;
  const cacheable = new Response(response.body, response);
  cacheable.headers.set('Cache-Control', IMAGE_CACHE_CONTROL);
  ctx.waitUntil(cache.put(cacheKey, cacheable.clone()));
  return cacheable;
}

export default {
  async fetch(request: Request, env: unknown, ctx: Ctx): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === 'GET' && pathname === IMAGE_PATH) return cachedImage(request, env, ctx);
    return next.fetch(request, env, ctx);
  },
} satisfies Worker;
