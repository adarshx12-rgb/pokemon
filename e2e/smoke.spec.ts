import { test, expect } from '@playwright/test';

test('home renders the hero', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Rare by design.');
  // aria-label on a generic <span> is prohibited in ARIA 1.2, so the name must come from real (sr-only) text.
  await expect(page.locator('h1 .sr-only')).toHaveText('Rare by design.');
  await expect(page.locator('h1 [aria-label]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Enter the Vault' })).toBeVisible();
});

test('vault ranks tiers and opens a card', async ({ page }) => {
  await page.goto('/cards');
  const bands = page.getByTestId('tier-band');
  await expect(bands.first()).toBeVisible();
  const tiers = await bands.evaluateAll(els => els.map(e => e.getAttribute('data-tier')));
  const order = ['grail', 'ultra', 'holo', 'rare', 'uncommon', 'common'];
  expect(tiers).toEqual([...tiers].sort((a, b) => order.indexOf(a!) - order.indexOf(b!)));
  await page.getByTestId('card-tile').first().click();
  await expect(page.getByRole('heading', { name: /identify value/i })).toBeVisible();
  await expect(page.getByText(/Estimated value|Price unavailable/)).toBeVisible();
});

test('unknown card shows the 404', async ({ page }) => {
  await page.goto('/cards/not-a-real-card');
  await expect(page.getByText('MissingNo.')).toBeVisible();
});

test('showdown: build teams, battle, skip to result', async ({ page }) => {
  await page.goto('/showdown');
  await page.getByTestId('search-A').fill('pikachu');
  await page.getByRole('option', { name: 'Pikachu', exact: true }).click();
  await expect(page.getByTestId('slot-A-0')).toBeVisible();
  await page.getByTestId('randomize').click();
  await expect(page.getByTestId('slot-B-5')).toBeVisible();
  await page.getByTestId('battle-start').click();
  await page.getByTestId('skip').click();
  await expect(page.getByTestId('result-banner')).toHaveText(/VICTORY|DEFEAT/);
  await page.getByRole('button', { name: 'Rematch' }).click();
  await expect(page.getByTestId('skip')).toBeVisible();
});

test('nav marks the current page', async ({ page }) => {
  await page.goto('/cards');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Vault', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'The Grail' })).not.toHaveAttribute('aria-current', 'page');
});
