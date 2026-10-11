import { test, expect } from '@playwright/test';

test('home hero is a 3-panel manga spread', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByTestId('hero');
  await expect(hero.locator('[data-ink-panel]')).toHaveCount(3);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Rare by design.');
});

test('no failed decor requests and no horizontal scroll at 375px', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', r => { if (r.url().includes('/decor/') && r.status() >= 400) failed.push(r.url()); });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(failed).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('home chapter shows five panels', async ({ page }) => {
  await page.goto('/');
  const chapter = page.getByTestId('chapter');
  await chapter.scrollIntoViewIfNeeded();
  await expect(chapter.locator('[data-chapter-panel]')).toHaveCount(5);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('every chapter panel is visible without scrolling animation', async ({ page }) => {
    await page.goto('/');
    const panels = page.getByTestId('chapter').locator('[data-chapter-panel]');
    for (let i = 0; i < 5; i++) {
      await panels.nth(i).scrollIntoViewIfNeeded();
      await expect(panels.nth(i)).toBeVisible();
      expect(await panels.nth(i).evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    }
  });
});

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

test('after the chapter zoom, nothing overflows or blocks the feature links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.mouse.move(700, 450);
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(250); }
  await page.waitForTimeout(1500);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
  const link = page.getByRole('link', { name: /Six against six/ });
  await link.scrollIntoViewIfNeeded();
  const box = (await link.boundingBox())!;
  const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('a[href="/showdown"]'), [box.x + 30, box.y + box.height / 2]);
  expect(hit).toBe(true);
});

test('feature panel links show a visible focus ring inside the panel', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('a[href="/showdown"]').filter({ hasText: 'Six against six' });
  await link.focus();
  const style = await link.evaluate(el => { const s = getComputedStyle(el); return { w: parseFloat(s.outlineWidth), o: parseFloat(s.outlineOffset), st: s.outlineStyle }; });
  expect(style.st).not.toBe('none');
  expect(style.w).toBeGreaterThanOrEqual(2);
  expect(style.o).toBeLessThan(0);
});

test.describe('short desktop viewport', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 600 } });
  test('chapter panel content is not clipped', async ({ page }) => {
    await page.goto('/');
    const clipped = await page.getByTestId('chapter').locator('[data-ink-panel]').evaluateAll(els => els.filter(e => e.scrollHeight > e.clientHeight + 1).length);
    expect(clipped).toBe(0);
  });
});

test('chapter tier list keeps AA-level opacity', async ({ page }) => {
  await page.goto('/');
  const opacities = await page.getByTestId('chapter').locator('ol li').evaluateAll(els => els.map(e => parseFloat(getComputedStyle(e).opacity)));
  expect(Math.min(...opacities)).toBeGreaterThanOrEqual(0.7);
});

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
