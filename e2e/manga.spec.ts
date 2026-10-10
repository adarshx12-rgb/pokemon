import { test, expect } from '@playwright/test';

test('headings use Dela Gothic One and body uses Zen Kaku Gothic New', async ({ page }) => {
  await page.goto('/');
  const h1Font = await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily);
  const bodyFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  expect(h1Font).toMatch(/Dela Gothic One/i);
  expect(bodyFont).toMatch(/Zen Kaku Gothic New/i);
  await expect(page.locator('svg filter#ink-rough')).toHaveCount(1);
});
