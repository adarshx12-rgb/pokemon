/**
 * fetch that retries 5xx responses and network errors with linear backoff.
 * The public Pokémon TCG API fails ~40% of calls, so the default allows 6 retries (~6s worst case).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { retries = 6, delayMs = 300 }: { retries?: number; delayMs?: number } = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt === retries;
    try {
      const res = await fetch(url, init);
      if (res.status < 500 || last) return res;
    } catch (err) {
      if (last) throw err;
    }
    await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
  }
}
