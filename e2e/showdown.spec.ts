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
  movePool: ['tackle', 'body-slam', 'quick-attack', 'hyper-fang'].map((name, index) => ({ name, power: 40 + index * 10, accuracy: 100, type: 'normal', damageClass: 'physical', pp: 10 })),
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

// A menu that is waiting for input: the main menu or the replace-after-faint picker.
const waiting = (page: Page) => page.locator('[data-testid="menu-fight"]:enabled, [data-testid^="party-"]:enabled');

/** Opens FIGHT from the main menu and waits for the move buttons. */
async function openFight(page: Page) {
  const fight = page.getByTestId('menu-fight');
  if (await fight.isVisible()) await fight.click();
  await expect(page.locator('[data-testid^="move-"]:enabled').first()).toBeVisible();
}

async function finishBattle(page: Page) {
  for (let turn = 0; turn < 200; turn++) {
    if (await page.getByRole('button', { name: 'View result', exact: true }).isVisible()) break;
    const party = page.locator('[data-testid^="party-"]:enabled');
    if (await party.count()) {
      await party.first().click(); // replacement prompt: the preselected first healthy slot
    } else {
      await openFight(page);
      await page.locator('[data-testid^="move-"]:enabled').first().click();
    }
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
  await expect(page.getByTestId('menu-fight')).toBeVisible();
  const hp = page.getByRole('progressbar');
  const hpValues = () => hp.evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-valuenow')));
  const before = await hpValues();
  await page.clock.fastForward(30_000);
  expect(await hpValues()).toEqual(before);
  await page.getByTestId('menu-fight').click();
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(4);
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

test('hp number counts down instead of jumping', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  const number = async () => Number(await page.getByTestId('hp-number-B').textContent());
  const target = async () => Number(await page.getByRole('progressbar', { name: /BLASTOISE HP/ }).getAttribute('aria-valuenow'));
  const start = await number();
  expect(start).toBe(await target());
  await page.getByTestId('menu-fight').click();
  await page.locator('[data-testid^="move-A-"]:enabled').last().click();
  // Step the clock until the hit lands (the bar's target changes), then watch the number drain.
  for (let i = 0; i < 600 && (await target()) === start; i++) await page.clock.runFor(16);
  const final = await target();
  expect(final).toBeLessThan(start);
  await page.clock.runFor(48);
  const first = await number();
  expect(first).toBeLessThan(start);
  expect(first).toBeGreaterThan(final);
  await page.clock.runFor(200);
  expect(await number()).toBeLessThan(first);
  await page.clock.runFor(2_000);
  expect(await number()).toBe(final);
});

test('a switch-in shows its HP bar at full value immediately', async ({ page }) => {
  await page.goto('/showdown');
  for (const [side, name] of [['A', 'pikachu'], ['A', 'charizard'], ['B', 'blastoise'], ['B', 'gengar']] as const) await add(page, side, name);
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  const read = (side: 'A' | 'B') => page.getByTestId(`hp-box-${side}`).evaluate(box => {
    const bar = box.querySelector('[role="progressbar"]')!;
    return { label: bar.getAttribute('aria-label'), now: Number(bar.getAttribute('aria-valuenow')), shown: Number(box.querySelector('[data-testid^="hp-number"]')!.textContent!.split('/')[0]) };
  });
  const first = { A: (await read('A')).label, B: (await read('B')).label };
  for (let turn = 0; turn < 60; turn++) {
    const party = page.locator('[data-testid^="party-"]:enabled');
    if (await party.count()) await party.first().click();
    else {
      await page.getByTestId('menu-fight').click();
      await page.locator('[data-testid^="move-"]:enabled').first().click();
    }
    for (let i = 0; i < 800; i++) {
      await page.clock.runFor(16);
      for (const side of ['A', 'B'] as const) {
        const hp = await read(side);
        if (hp.label !== first[side]) { expect(hp.shown).toBe(hp.now); return; }
      }
      if (i > 0 && (await waiting(page).count()) > 0) break;
    }
  }
  throw new Error('no Pokémon fainted');
});

test('reduced motion jumps the HP number to its target', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  const number = async () => Number(await page.getByTestId('hp-number-B').textContent());
  const target = async () => Number(await page.getByRole('progressbar', { name: /BLASTOISE HP/ }).getAttribute('aria-valuenow'));
  const start = await number();
  await page.getByTestId('menu-fight').click();
  await page.locator('[data-testid^="move-A-"]:enabled').last().click();
  for (let i = 0; i < 600 && (await target()) === start; i++) await page.clock.runFor(16);
  const final = await target();
  expect(final).toBeLessThan(start);
  await page.clock.runFor(350);
  expect(await number()).toBe(final);
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
  await expect(page.getByTestId('menu-fight')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const mobileHp = () => page.getByRole('progressbar').evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-valuenow')));
  const beforeAttack = await mobileHp();
  // The page may still be settling its scroll-into-view; retry the tap until the Fight menu opens.
  await expect(async () => {
    await page.getByTestId('menu-fight').tap();
    await expect(page.locator('[data-testid^="move-"]')).toHaveCount(4, { timeout: 2_000 });
  }).toPass();
  await page.locator('[data-testid^="move-"]:enabled').first().tap();
  await expect.poll(mobileHp).not.toEqual(beforeAttack);
  await expect(page.getByTestId('turn-label')).toBeVisible();
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
  await page.getByTestId('menu-fight').click();
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
      await expect(async () => { // the page may still be settling its scroll-into-view
        await page.getByTestId('menu-fight').tap();
        await expect(page.locator('[data-testid^="move-"]')).toHaveCount(4, { timeout: 2_000 });
      }).toPass();
      const ready = page.locator('[data-testid^="move-"]:enabled');
      await expect(ready).toHaveCount(4);
      await expect(page.locator('[data-testid^="move-"]:visible')).toHaveCount(4);
      await expect(ready.first()).toBeInViewport();
      await page.screenshot({ path: `test-results/showdown-mobile-turn-${turn}.png`, animations: 'disabled', caret: 'initial' });
      await ready.first().tap();
      // The move plays out, then the main menu comes back for whoever acts next.
      await expect(page.getByTestId('menu-fight')).toBeVisible({ timeout: 30_000 });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test('fight menu opens moves and back returns', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('turn-label')).toHaveText('YOUR TURN');
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(0);
  await page.getByTestId('menu-fight').click();
  await expect(page.locator('[data-testid^="move-A-"]')).toHaveCount(4);
  await expect(page.getByTestId('move-A-tackle')).toContainText('PP 10/10');
  await page.getByTestId('menu-back').click();
  await expect(page.getByTestId('menu-fight')).toBeVisible();
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(0);
});

test('switching from the POKéMON menu uses the turn', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'A', 'charizard');
  await add(page, 'B', 'blastoise');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await page.getByTestId('menu-pokemon').click();
  await expect(page.getByTestId('party-A-0')).toBeDisabled(); // already in battle
  await page.getByTestId('party-A-1').click();
  await expect(page.locator('[data-testid^="party-"]:enabled')).toHaveCount(0);
  await page.clock.fastForward(10_000);
  await expect(page.getByTestId('turn-label')).toHaveText("RIVAL'S TURN");
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Charizard');
});

test('run returns to the builder', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.getByTestId('battle-start').click();
  await page.getByTestId('menu-run').click();
  await expect(page.getByText('Give up the battle?')).toBeVisible();
  await page.getByRole('button', { name: 'NO', exact: true }).click();
  await expect(page.getByTestId('menu-fight')).toBeVisible();
  await page.getByTestId('menu-run').click();
  await page.getByTestId('run-yes').click();
  await expect(page.getByTestId('battle-stage')).toHaveCount(0);
  await expect(page.getByTestId('battle-start')).toBeVisible();
});

test('a fainted Pokémon is replaced from the party menu', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'A', 'charizard');
  await add(page, 'B', 'blastoise');
  await add(page, 'B', 'gengar'); // two per side: the first knockout always needs a replacement
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  for (let turn = 0; turn < 100; turn++) {
    const party = page.locator('[data-testid^="party-"]:enabled');
    if (await party.count()) {
      await expect(page.getByTestId('menu-fight')).toHaveCount(0);
      await party.first().click();
      return;
    }
    await openFight(page);
    await page.locator('[data-testid^="move-"]:enabled').first().click();
    await finishAttack(page);
  }
  throw new Error('no replacement prompt');
});

test('offers Struggle when no PP is left', async ({ page }) => {
  await page.unroute('**/api/pokemon/*');
  await page.route('**/api/pokemon/*', async route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)!);
    const base = pokemon(name);
    await route.fulfill({ json: { ...base, movePool: [{ ...base.movePool[0], pp: 1 }] } });
  });
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  // Each side spends its only PP, then the next A turn offers Struggle (B may move first in round two).
  for (let turn = 0; turn < 6; turn++) {
    await openFight(page);
    if (await page.getByTestId('move-A-struggle').isVisible()) break;
    await page.locator('[data-testid^="move-"]:enabled').first().click();
    await finishAttack(page);
  }
  await expect(page.getByTestId('move-A-struggle')).toBeEnabled();
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(1);
});
