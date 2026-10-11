import { test, expect, type Page } from '@playwright/test';

test.use({ hasTouch: true });
const ids: Record<string, number> = { pikachu: 25, charizard: 6, blastoise: 9, gengar: 94, chikorita: 152, cyndaquil: 155, totodile: 158 };
const pokemon = (name: string) => ({
  id: ids[name] ?? 25, name, types: ['normal'],
  baseStats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
  sprites: {
    artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${ids[name] ?? 25}.png`,
    front: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ids[name] ?? 25}.png`,
    back: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${ids[name] ?? 25}.png`,
  },
  movePool: [{ name: 'tackle', power: 40, accuracy: 100, type: 'normal', damageClass: 'physical' }],
});

async function add(page: Page, side: 'A' | 'B', name: string) {
  await page.getByTestId(`search-${side}`).fill(name);
  await page.getByRole('option', { name: new RegExp(`^${name}`, 'i') }).first().click();
  await expect(page.getByTestId(`search-${side}`)).not.toHaveAttribute('placeholder', 'Loading from the Pokédex…');
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/pokemon/*', async route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)!);
    await route.fulfill({ json: pokemon(name) });
  });
});

test('empty opening, artwork, pointer/keyboard order, battle, rematch and reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showdown');
  await expect(page.getByTestId('arena-preview').locator('img')).toHaveCount(0);
  await expect(page.getByTestId('battle-start')).toBeDisabled();
  await expect(page.locator('[data-testid^="empty-"]')).toHaveCount(12);
  // Avoid Playwright mutating input caret styles while React is hydrating.
  await page.screenshot({ path: 'test-results/showdown-empty.png', fullPage: true, caret: 'initial' });
  await add(page, 'A', 'pikachu');
  await expect(page.getByTestId('battle-start')).toBeDisabled();
  await add(page, 'A', 'charizard');
  await add(page, 'B', 'blastoise');
  await expect(page.getByTestId('battle-start')).toBeEnabled();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Pikachu');
  const from = await page.getByTestId('slot-A-1').boundingBox();
  const to = await page.getByTestId('slot-A-0').boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId('slot-A-0')).toHaveAccessibleName(/Charizard/);
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Charizard');
  await page.getByTestId('slot-A-0').press('Alt+ArrowRight');
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Pikachu');
  await page.getByRole('button', { name: 'Classic sprites' }).click();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('src', /back\/25.png/);
  await page.getByRole('button', { name: 'HD artwork' }).click();
  await expect.poll(() => page.getByTestId('arena-preview').locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: 'test-results/showdown-teams.png', fullPage: true, animations: 'disabled', caret: 'initial' });
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Pikachu');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByTestId('skip').click();
  await expect(page.getByTestId('result-banner')).toHaveText(/VICTORY|DEFEAT/);
  await page.getByRole('button', { name: 'Rematch', exact: true }).click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  await page.getByTestId('skip').click();
  await page.getByRole('button', { name: 'Edit teams', exact: true }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('[data-testid^="slot-"]')).toHaveCount(0);
  await expect(page.getByTestId('arena-preview').locator('img')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('six-slot cap, removal, and recoverable data failure', async ({ page }) => {
  await page.goto('/showdown');
  await page.route('**/api/pokemon/pikachu', route => route.fulfill({ status: 503, json: { error: 'upstream' } }), { times: 1 });
  await add(page, 'A', 'pikachu');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load' })).toBeVisible();
  await expect(page.getByTestId('battle-start')).toBeDisabled();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByTestId('slot-A-0')).toBeVisible();
  for (let i = 1; i < 6; i++) await add(page, 'A', 'pikachu');
  await expect(page.locator('[data-testid^="slot-A-"]')).toHaveCount(6);
  await expect(page.getByTestId('search-A')).toBeDisabled();
  await expect(page.getByTestId('search-A')).toHaveAttribute('placeholder', 'All 6 slots filled');
  await page.getByRole('button', { name: 'Remove Pikachu', exact: true }).click();
  await expect(page.getByTestId('search-A')).toBeEnabled();
  await expect(page.locator('[data-testid^="slot-A-"]')).toHaveCount(5);
  await add(page, 'A', 'charizard');
  await expect(page.getByTestId('slot-A-5')).toHaveAccessibleName(/Charizard/);
});

test('phone touch ordering, empty slots focus search, and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/showdown');
  await page.getByTestId('empty-A-0').tap();
  await expect(page.getByTestId('search-A')).toBeFocused();
  await add(page, 'A', 'cyndaquil');
  await add(page, 'A', 'totodile');
  await page.getByTestId('slot-A-0').scrollIntoViewIfNeeded();
  const from = await page.getByTestId('slot-A-1').boundingBox();
  const to = await page.getByTestId('slot-A-0').boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const y = from!.y + from!.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from!.x + from!.width / 2, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to!.x + to!.width / 2, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByTestId('slot-A-0')).toHaveAccessibleName(/Totodile/);
  await add(page, 'B', 'chikorita');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => page.getByTestId('arena-preview').locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/showdown-phone.png', fullPage: true, animations: 'disabled', caret: 'initial' });
});
