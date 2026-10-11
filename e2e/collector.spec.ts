import { test, expect } from '@playwright/test';

test('each tier has inline notes and cards open an accessible window without losing the grid', async ({ page }) => {
  await page.goto('/cards');
  const bands = page.getByTestId('tier-band');
  for (const band of await bands.all()) {
    await expect(band.locator('[data-featured] [data-testid="collector-notes"]')).toHaveCount(1);
  }
  const card = page.getByTestId('card-tile').nth(1);
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/cards$/);
  await expect(dialog.getByText('Catalog rarity', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Illustrator', { exact: true })).toBeVisible();
  await expect(dialog.getByTestId('collector-notes')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close card details' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(card).toBeFocused();
  expect(Math.abs(await page.evaluate(() => window.scrollY) - scrollY)).toBeLessThan(3);
  await page.getByTestId('card-tile').nth(2).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close card details' }).click();
  await expect(dialog).not.toBeVisible();
});

test('owned and wishlist choices persist, stay independent, and sync across inline and detail views', async ({ page }) => {
  await page.goto('/cards');
  const featured = page.locator('[data-featured]').first();
  await featured.getByRole('button', { name: '+ I own this', exact: true }).click();
  const href = await featured.getByTestId('card-tile').getAttribute('href');
  await featured.getByTestId('card-tile').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: '✓ In my collection', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: '+ Add to wishlist', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(featured.getByRole('button', { name: '✓ On my wishlist', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(featured.getByRole('button', { name: '✓ In my collection', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(featured.getByRole('button', { name: '✓ On my wishlist', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto(href!);
  await expect(page.getByRole('button', { name: '✓ In my collection', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '✓ On my wishlist', exact: true }).click();
  await expect(page.getByRole('button', { name: '+ Add to wishlist', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('phone window scrolls independently, zooms artwork and closes by backdrop', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/cards');
  await page.getByTestId('card-tile').nth(1).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Enlarge artwork' }).click();
  await expect(dialog.getByRole('button', { name: 'Return to details' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Return to details' }).click();
  await dialog.getByRole('heading', { name: /identify value/ }).scrollIntoViewIfNeeded();
  expect(await dialog.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await dialog.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
});

test.describe('no JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('notes remain readable and card links open dedicated pages', async ({ page }) => {
    await page.goto('/cards');
    await expect(page.getByTestId('collector-notes').first()).toBeVisible();
    await page.getByTestId('card-tile').first().click();
    await expect(page).toHaveURL(/\/cards\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('collector-notes')).toBeVisible();
  });
});
