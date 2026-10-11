import { test, expect } from '@playwright/test';

test('home opens on the site name and description', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Pokémon Vault');
  await expect(page.getByText(/A vault of rare Pokémon cards, from Base Set holos to Gold Stars\./)).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Rayquaza' })).toBeAttached();
});

test('headlines use Anton and copy uses JetBrains Mono', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily)).toMatch(/Anton/);
  expect(await page.locator('[data-part="welcome"] .copy').evaluate(el => getComputedStyle(el).fontFamily)).toMatch(/JetBrains Mono/);
});

test('card faces load and nothing overflows at 375px', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', r => { if (r.url().includes('grail') && r.status() >= 400) failed.push(r.url()); });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(failed).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows welcome, grail, and both doors as plain stacked screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-part="welcome"]')).toBeVisible();
    const vault = page.getByRole('link', { name: /Enter the vault/ });
    const showdown = page.getByRole('link', { name: /Enter the arena/ });
    await vault.scrollIntoViewIfNeeded();
    await expect(vault).toBeVisible();
    await expect(showdown).toBeVisible();
    await expect(page.locator('[data-glitter]')).toBeHidden();
    expect(await page.locator('[data-vault-card]').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  });
  test('door links go to the vault and the arena', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the vault/ }).click();
    await expect(page).toHaveURL(/\/cards$/);
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the arena/ }).click();
    await expect(page).toHaveURL(/\/showdown$/);
  });
});
