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
  movePool: ['tackle', 'body-slam', 'quick-attack', 'hyper-fang'].map((name, index) => ({ name, power: 40 + index * 10, accuracy: 100, type: 'normal', damageClass: 'physical' })),
  ...(name === 'charizard' && { megas: [10034, 10035].map((id, i) => ({
    name: `charizard-mega-${'xy'[i]}`, types: i ? ['fire', 'flying'] : ['fire', 'dragon'],
    baseStats: { hp: 80, atk: 130, def: 111, spa: 130, spd: 85, spe: 100 },
    sprites: {
      artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      front: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      back: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`,
    },
  })) }),
});

async function add(page: Page, side: 'A' | 'B', name: string) {
  await page.getByTestId(`search-${side}`).fill(name);
  await page.getByRole('option', { name: new RegExp(`^${name}`, 'i') }).first().click();
  await expect(page.getByTestId(`search-${side}`)).not.toHaveAttribute('placeholder', 'Loading from the Pokédex…');
}

async function finishAttack(page: Page) {
  await expect(page.locator('[data-testid^="move-"]:enabled')).toHaveCount(0);
  // Jump between battle events without replaying thousands of unrelated scroll frames.
  for (let event = 0; event < 7; event++) await page.clock.fastForward(5_000);
}

async function finishBattle(page: Page) {
  for (let turn = 0; turn < 100; turn++) {
    if (await page.getByRole('button', { name: 'View result', exact: true }).isVisible()) break;
    await page.locator('[data-testid^="move-"]:enabled').first().click();
    await finishAttack(page);
  }
  await page.getByRole('button', { name: 'View result', exact: true }).click();
  await expect(page.getByTestId('result-banner')).toHaveText(/VICTORY|DEFEAT/);
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
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    for (const name of [/My team/, /Opponent/]) {
      const panel = page.getByRole('region', { name });
      await expect(panel.locator('select')).toHaveCount(4);
      const box = await panel.boundingBox();
      expect(box!.y).toBeGreaterThan(60);
      expect(box!.y + box!.height).toBeLessThan(viewport.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/showdown-teams.png', fullPage: true, animations: 'disabled', caret: 'initial' });
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Pikachu');
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(8);
  const hp = page.getByRole('progressbar');
  const hpValues = () => hp.evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-valuenow')));
  const before = await hpValues();
  await page.clock.fastForward(30_000);
  expect(await hpValues()).toEqual(before);
  const selected = page.locator('[data-testid^="move-"]:enabled').last();
  const selectedId = await selected.getAttribute('data-testid');
  await selected.click();
  await expect(page.locator('[data-testid^="move-"]:enabled')).toHaveCount(0);
  await finishAttack(page);
  expect(await hpValues()).not.toEqual(before);
  await expect(page.getByTestId('battle-stage')).toContainText(selectedId!.split('-').slice(2).join(' ').toUpperCase());
  const after = await hpValues();
  await page.clock.fastForward(30_000);
  expect(await hpValues()).toEqual(after);
  await page.screenshot({ path: 'test-results/showdown-manual-desktop.png', fullPage: true, caret: 'initial' });
  await page.getByRole('button', { name: 'Reset battle', exact: true }).click();
  expect(await hpValues()).toEqual(before);
  await finishBattle(page);
  await page.getByRole('button', { name: 'Rematch', exact: true }).click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  await finishBattle(page);
  await page.getByRole('button', { name: 'Edit teams', exact: true }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('[data-testid^="slot-"]')).toHaveCount(0);
  await expect(page.getByTestId('arena-preview').locator('img')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('six-slot cap, removal, and recoverable data failure', async ({ page }) => {
  await page.goto('/showdown');
  await page.route('**/api/pokemon/pikachu*', route => route.fulfill({ status: 503, json: { error: 'upstream' } }), { times: 1 });
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
  await page.getByTestId('battle-start').click();
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const mobileHp = () => page.getByRole('progressbar').evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-valuenow')));
  const beforeAttack = await mobileHp();
  await page.locator('[data-testid^="move-"]:enabled').first().tap();
  await expect.poll(mobileHp).not.toEqual(beforeAttack);
  await expect(page.getByTestId('turn-prompt')).toBeVisible();
  await page.screenshot({ path: 'test-results/showdown-manual-phone.png', fullPage: true, caret: 'initial' });
});

test('live species learnsets keep Blastoise and Pikachu moves separate', async ({ page }) => {
  await page.unroute('**/api/pokemon/*');
  await page.goto('/showdown');
  await add(page, 'A', 'blastoise');
  const player = page.getByRole('region', { name: /My team/ });
  await expect(player.locator('select')).toHaveCount(4);
  await expect(player.locator('option[value="thunderbolt"]')).toHaveCount(0);
  await expect(player.locator('option[value="flamethrower"]')).toHaveCount(0);
  await expect(player.locator('optgroup[label="Naturally learned"] option[value="hydro-pump"]')).toHaveCount(4);
  await expect(player.locator('optgroup[label="Other learnable moves"] option[value="ice-beam"]')).toHaveCount(4);
  await player.locator('select').first().selectOption('ice-beam');
  await expect(player.locator('select').first()).toHaveValue('ice-beam');
  await expect(player.locator('select').nth(1).locator('option[value="ice-beam"]')).toHaveJSProperty('disabled', true);
  await add(page, 'B', 'pikachu');
  const opponent = page.getByRole('region', { name: /Opponent/ });
  await expect(opponent.locator('option[value="thunderbolt"]')).toHaveCount(4);
  await expect(opponent.locator('option[value="hydro-pump"]')).toHaveCount(0);
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('move-A-ice-beam')).toBeVisible();
  await expect(page.locator('[data-testid^="move-B-hydro-pump"]')).toHaveCount(0);
});

test.describe('phone emulation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  test('fields avoid iOS focus zoom and only the next mover’s buttons sit under the arena', async ({ page }) => {
    await page.goto('/showdown');
    expect(await page.getByTestId('search-A').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await add(page, 'A', 'cyndaquil');
    await add(page, 'B', 'chikorita');
    expect(await page.getByRole('region', { name: /My team/ }).locator('select').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await page.screenshot({ path: 'test-results/showdown-mobile-build.png', fullPage: true, animations: 'disabled', caret: 'initial' });
    await page.getByTestId('battle-start').tap();
    await expect(page.getByTestId('battle-stage')).toBeInViewport();
    for (let turn = 0; turn < 2; turn++) {
      const ready = page.locator('[data-testid^="move-"]:enabled');
      await expect(ready).toHaveCount(4);
      await expect(page.locator('[data-testid^="move-"]:visible')).toHaveCount(4);
      await expect(ready.first()).toBeInViewport();
      await page.screenshot({ path: `test-results/showdown-mobile-turn-${turn}.png`, animations: 'disabled', caret: 'initial' });
      const before = await page.getByTestId('turn-prompt').textContent();
      await ready.first().tap();
      await expect(page.getByTestId('turn-prompt')).not.toHaveText(before!, { timeout: 30_000 });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test('the HP number drains towards the new value instead of jumping', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  const bar = page.getByRole('progressbar', { name: /Blastoise HP/i });
  const panel = page.locator('[class*="hpPanel"]').filter({ has: bar });
  const shown = async () => Number((await panel.textContent())!.match(/(\d+) \/ \d+/)![1]);
  const start = Number(await bar.getAttribute('aria-valuenow'));
  await page.locator('[data-testid^="move-A-"]:enabled').last().click();
  for (let i = 0; i < 600 && Number(await bar.getAttribute('aria-valuenow')) === start; i++) await page.clock.runFor(16);
  const target = Number(await bar.getAttribute('aria-valuenow'));
  expect(target).toBeLessThan(start);
  await page.clock.runFor(32);
  const mid = await shown();
  expect(mid).toBeGreaterThan(target); // still draining a moment after the hit
  expect(mid).toBeLessThanOrEqual(start);
  await page.clock.runFor(1_600);
  expect(await shown()).toBe(target);
});

test('an eligible Pokémon Mega Evolves mid-battle with higher stats and a new look', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'charizard');
  await expect(page.getByTestId('can-mega-A')).toBeVisible();
  await add(page, 'B', 'blastoise');
  await expect(page.getByTestId('can-mega-B')).toHaveCount(0);
  await page.getByTestId('battle-start').click();
  await expect(page.locator('[data-testid^="mega-B-"]')).toHaveCount(0); // Blastoise's mock has no Mega form
  const megaX = page.getByTestId('mega-A-charizard-mega-x');
  await expect(megaX).toHaveAccessibleName('Mega Evolve into Mega Charizard X');
  await expect(page.getByTestId('mega-A-charizard-mega-y')).toBeVisible();
  await megaX.click();
  await expect(megaX).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('mega-stats-A')).toContainText('Fire / Dragon');
  await expect(page.getByTestId('mega-stats-A')).toContainText('Atk 100→150'); // level-50 stats from base 80 → 130
  await page.getByTestId('move-A-tackle').click();
  await expect(page.getByTestId('battle-stage')).toContainText('CHARIZARD has Mega Evolved into MEGA CHARIZARD X!');
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('src', /back\/10034\.png$|official-artwork\/10034\.png$/);
  await expect(page.getByRole('region', { name: 'Your Mega Charizard X moves' })).toBeVisible();
  await expect(page.locator('[data-testid^="mega-A-"]')).toHaveCount(0); // once per Pokémon
  await expect(page.getByText('MEGA CHARIZARD X', { exact: true })).toBeVisible(); // HP panel name
});

test('a Mega Evolved Pokémon shows its Mega sprite in classic mode with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showdown');
  await page.getByRole('button', { name: 'Classic sprites' }).click();
  await add(page, 'A', 'charizard');
  await add(page, 'B', 'blastoise');
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('src', /back\/6\.png$/);
  await page.getByTestId('mega-A-charizard-mega-y').click();
  await page.getByTestId('move-A-tackle').click();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('src', /back\/10035\.png$/);
});
