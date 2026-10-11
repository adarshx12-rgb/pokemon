import { test, expect } from '@playwright/test';

test('vault tiers are manga pages with at most one splash each', async ({ page }) => {
  await page.goto('/cards');
  const bands = page.getByTestId('tier-band');
  await expect(bands.first().locator('[data-ink-panel]').first()).toBeVisible();
  const splashCounts = await bands.evaluateAll(els => els.map(e => e.querySelectorAll('[data-splash]').length));
  for (const n of splashCounts) expect(n).toBeLessThanOrEqual(1);
});

test('vault has no horizontal scroll at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/cards');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('card detail uses an ink frame and a speech-bubble note', async ({ page }) => {
  await page.goto('/cards');
  await page.getByTestId('card-tile').first().click();
  await expect(page.getByRole('heading', { name: /identify value/i })).toBeVisible();
  await expect(page.locator('main [data-ink-panel]').first()).toBeVisible();
  await expect(page.locator('main blockquote')).toHaveCount(0);
});

// ---- Final-review fixes ----

const overflowX = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Headings whose text is wider than their own box (clipped by an overflow-hidden panel). */
const clippedHeadings = (page: import('@playwright/test').Page) =>
  page.evaluate(() => [...document.querySelectorAll('h1, h2')]
    .filter(h => !h.closest('.sr-only') && h.scrollWidth > h.clientWidth + 1)
    .map(h => h.textContent));

for (const path of ['/cards', '/cards/base1-46', '/cards/base1-24', '/showdown']) {
  test(`headings fit at 375px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await overflowX(page)).toBeLessThanOrEqual(0);
    expect(await clippedHeadings(page)).toEqual([]);
  });
}

test('uses the default system cursor', async ({ page }) => {
  // Headless Chrome reports no fine pointer, so the custom cursor never mounts here; check the CSS that hid the real one instead.
  await page.goto('/');
  const hidesCursor = await page.evaluate(() => {
    const walk = (rules: CSSRuleList): boolean => [...rules].some(r =>
      (r instanceof CSSStyleRule && r.style.cursor === 'none') || ('cssRules' in r && walk((r as CSSGroupingRule).cssRules)));
    return [...document.styleSheets].some(sheet => { try { return walk(sheet.cssRules); } catch { return false; } });
  });
  expect(hidesCursor).toBe(false);
});
