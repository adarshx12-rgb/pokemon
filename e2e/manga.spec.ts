import { test, expect } from '@playwright/test';

test('headings use Dela Gothic One and body uses Zen Kaku Gothic New', async ({ page }) => {
  await page.goto('/');
  const h1Font = await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily);
  const bodyFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  expect(h1Font).toMatch(/Dela Gothic One/i);
  expect(bodyFont).toMatch(/Zen Kaku Gothic New/i);
  await expect(page.locator('svg filter#ink-rough')).toHaveCount(1);
});

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
