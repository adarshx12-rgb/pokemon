/** fetch that retries 5xx responses and network errors (the public Pokémon APIs fail intermittently). */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { retries = 3, delayMs = 400 }: { retries?: number; delayMs?: number } = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt === retries;
    try {
      const res = await fetch(url, init);
      if (res.status < 500 || last) return res;
    } catch (err) {
      if (last) throw err;
    }
    await new Promise(r => setTimeout(r, delayMs * 2 ** attempt));
  }
}
