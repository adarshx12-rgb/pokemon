import { test, expect } from '@playwright/test';

test('FAQ answers are readable without JavaScript and keyboard operable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const faq = page.locator('#faq');
  await expect(faq.locator('details')).toHaveCount(7);
  const question = faq.getByText('How do I tell if a Pokémon card is rare?', { exact: true });
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(faq.getByText(/Start with the rarity symbol/)).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(faq.getByText(/Start with the rarity symbol/)).toBeHidden();
  const price = faq.locator('details').filter({ hasText: 'How much is the most expensive Pokémon card?' });
  await price.locator('summary').click();
  await expect(price).toContainText('February 16, 2026');
  await expect(price.locator('a')).toHaveAttribute('href', /guinnessworldrecords\.com/);
  await context.close();
});

for (const [path, name] of [
  ['/about', 'About us'],
  ['/contact', 'Contact us'],
  ['/privacy-policy', 'Privacy policy'],
  ['/terms-and-conditions', 'Terms & conditions'],
]) {
  test(`${name} has unique metadata, footer navigation, and a mobile layout`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://pokefame.com${path}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://pokefame.com${path}`);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Site information' }).getByRole('link', { name: 'Contact us', exact: true })).toHaveAttribute('href', '/contact');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('mobile.png'), animations: 'disabled' });
  });
}

test('unknown routes return a real 404 with recovery links and noindex', async ({ page }) => {
  const response = await page.goto('/not-a-real-page', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'A wild MissingNo.' })).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('content')));
  expect(robots.some(value => value?.includes('noindex'))).toBe(true);
  await page.getByRole('link', { name: 'Back to home', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Pokéfame: rare Pokémon cards, prices and battles');
});

test('sitemap includes information pages and excludes error pages', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  const xml = await response.text();
  for (const path of ['/about', '/contact', '/privacy-policy', '/terms-and-conditions']) {
    expect(xml).toContain(`https://pokefame.com${path}</loc>`);
  }
  expect(xml).not.toMatch(/\/(404|500|not-a-real-page)<\/loc>/);
});

test('FAQ and footer fit both viewports', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const faq = page.locator('#faq');
    await faq.locator('summary').first().click();
    await faq.getByRole('heading', { level: 2 }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`faq-${width}.png`), animations: 'disabled' });
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`footer-${width}.png`), animations: 'disabled' });
  }
});
