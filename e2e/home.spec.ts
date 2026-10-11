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

const opacity = (page: import('@playwright/test').Page, sel: string) =>
  page.locator(sel).first().evaluate(el => Number(getComputedStyle(el).opacity));
/** Scroll to a fraction of the pinned sequence (desktop pin = 3 viewport heights). */
const scrollToProgress = async (page: import('@playwright/test').Page, p: number) => {
  await page.evaluate(p => window.scrollTo(0, window.innerHeight * 3 * p), p);
  await page.waitForTimeout(900); // let Lenis settle
};

test.describe('scroll sequence (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('welcome → grail → turn → doors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('[data-glitter]')).toBeVisible();
    expect(await opacity(page, '[data-grail-card]')).toBe(0);

    await scrollToProgress(page, 0.25);
    expect(await opacity(page, '[data-part="welcome"]')).toBe(0);
    expect(await opacity(page, '[data-grail-card]')).toBe(1);
    expect(await opacity(page, '[data-part="grailCopy"]')).toBe(1);

    await scrollToProgress(page, 0.5);
    expect(await opacity(page, '[data-caption="1"]')).toBe(1);

    await scrollToProgress(page, 1);
    expect(await opacity(page, '[data-grail-card]')).toBe(0);
    expect(await opacity(page, '[data-vault-card]')).toBe(1);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test('tabbing to a door jumps to the end of the sequence', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the vault/ }).focus();
    await page.waitForTimeout(900);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    expect(await opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('End key lands cleanly on the doors', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(1200);
    expect(await opacity(page, '[data-grail-card]')).toBe(0);
    expect(await opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('after a resize at the end, the card slot still matches the Vault door', async ({ page }) => {
    await page.goto('/');
    await scrollToProgress(page, 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3 * 0.99));
    await page.waitForTimeout(900);
    const [card, door] = await Promise.all([
      page.locator('[data-grail-card]').boundingBox(),
      page.locator('[data-door-card]').boundingBox(),
    ]);
    expect(Math.abs(card!.x + card!.width / 2 - (door!.x + door!.width / 2))).toBeLessThan(12);
    expect(Math.abs(card!.y + card!.height / 2 - (door!.y + door!.height / 2))).toBeLessThan(12);
  });

  test('leaving for the Vault stops the sequence without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await scrollToProgress(page, 1);
    await page.getByRole('link', { name: /Enter the vault/ }).click();
    await expect(page).toHaveURL(/\/cards$/);
    await expect(page.locator('[data-glitter]')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe('short desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 600 } });
  test('welcome link shows on load and both doors fit at the end', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Scroll to open the vault/ })).toBeInViewport({ ratio: 1 });
    await scrollToProgress(page, 1);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('both doors fit side by side at the end', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2)); // mobile pin = 2 viewport heights
    await page.waitForTimeout(900);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
  });
});
