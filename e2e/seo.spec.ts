import { test, expect } from '@playwright/test';

test('home exposes readable guide content and complete sharing metadata without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('Pokemon Cards, Rare Cards & Showdown | Pokéfame');
  const guide = page.locator('#field-guide');
  const words = (await guide.innerText()).trim().split(/\s+/).length;
  expect(words).toBeGreaterThanOrEqual(800);
  expect(words).toBeLessThanOrEqual(1200);
  console.log(`Homepage guide: ${words} words`);
  await expect(guide.getByRole('heading', { level: 3 })).toHaveCount(6);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/pokefame\.com\/?$/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /^https:\/\/pokefame\.com\/?$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://pokefame.com/social-image');
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  const [site, org] = schema['@graph'];
  expect(site['@type']).toBe('WebSite');
  expect(site.url).toBe('https://pokefame.com/');
  expect(org).toMatchObject({ '@type': 'Organization', logo: 'https://pokefame.com/apple-icon.png' });
  await context.close();
});

test('guide fits mobile and desktop with working chapter links', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const guide = page.locator('#field-guide');
    await expect(page.locator('.page-in')).toHaveCSS('opacity', '1');
    await page.locator('#field-guide-title').scrollIntoViewIfNeeded();
    await expect(guide).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`guide-${width}.png`), animations: 'disabled' });
  }
  await page.getByRole('link', { name: 'Learn the matchup', exact: true }).click();
  await expect(page.locator('#battle-matchups')).toBeInViewport();
});

test('card pages have unique metadata and use card artwork for sharing', async ({ page }) => {
  await page.goto('/cards/ex8-107', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Rayquaza.*Deoxys.*Pokéfame/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pokefame.com/cards/ex8-107');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /images\.pokemontcg\.io\/ex8\/107/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Rayquaza.*Deoxys/);
  const trail = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(trail.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'The Vault', 'Rayquaza ★ #107']);
  await expect(page.getByRole('heading', { level: 2, name: /More from|More .* cards/ }).first()).toBeAttached();
});

test('crawl endpoints and social preview image are available', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap: https://pokefame.com/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const path of ['/cards', '/showdown', '/cards/ex8-107']) expect(xml).toContain(`https://pokefame.com${path}</loc>`);
  const image = await request.get('/social-image');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/png');
  const png = await image.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('AI crawlers are allowed and llms.txt maps the site', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  const rules = await robots.text();
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) expect(rules).toContain(`User-Agent: ${bot}`);
  for (const path of ['/llms.txt', '/llm.txt']) {
    const llms = await request.get(path);
    expect(llms.ok()).toBe(true);
    expect(llms.headers()['content-type']).toContain('text/plain');
    const text = await llms.text();
    expect(text).toMatch(/^# POKÉFAME\n\n> /);
    for (const page of ['/cards', '/showdown', '/cards/ex8-107', '/about']) expect(text).toContain(`(https://pokefame.com${page})`);
  }
});
