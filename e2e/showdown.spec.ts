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
  // Jump between battle events (and the timed parts of send-outs) without replaying thousands of unrelated scroll frames.
  for (let event = 0; event < 10; event++) await page.clock.fastForward(5_000);
}

// A menu that is waiting for input: the main menu or the replace-after-faint picker.
const waiting = (page: Page) => page.locator('[data-testid="menu-fight"]:enabled, [data-testid^="party-"]:enabled');

/** Opens FIGHT from the main menu and waits for the move buttons. */
async function openFight(page: Page) {
  const fight = page.getByTestId('menu-fight');
  const moves = page.locator('[data-testid^="move-"]:enabled');
  await expect(fight.or(moves).first()).toBeVisible(); // the menu only appears once the last turn has played out
  if (await fight.isVisible()) await fight.click();
  await expect(moves.first()).toBeVisible();
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
  await expect(page.getByTestId('result-banner')).toHaveText(/defeated/);
}

// Logs, in order, each new text-box message and the first appearance of the watched elements in the battle stage.
async function watchBattle(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { battleLog: string[]; battleSeen: Set<string> };
    w.battleLog = [];
    w.battleSeen = new Set();
    let last = '';
    const check = () => {
      const stage = document.querySelector('[data-testid="battle-stage"]');
      if (!stage) { last = ''; w.battleSeen.clear(); return; }
      const message = stage.querySelector('[data-testid="text-box"] [aria-live]')?.textContent ?? '';
      if (message && message !== last) { last = message; w.battleLog.push(`text:${message}`); }
      for (const id of ['pokeball-throw-A', 'pokeball-throw-B', 'arena-pokemon-A', 'arena-pokemon-B', 'battle-fx']) {
        if (!w.battleSeen.has(id) && stage.querySelector(`[data-testid="${id}"]`)) { w.battleSeen.add(id); w.battleLog.push(id); }
      }
    };
    new MutationObserver(check).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
}
const battleLog = (page: Page) => page.evaluate(() => (window as unknown as { battleLog: string[] }).battleLog);
const clearBattleLog = (page: Page) => page.evaluate(() => { (window as unknown as { battleLog: string[] }).battleLog = []; });

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
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('src', /back\/25.png/); // pixel sprites are the default
  await page.getByRole('button', { name: 'HD artwork' }).click();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('src', /official-artwork\/25.png/);
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
  await watchBattle(page);
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  await expect(page.getByTestId('arena-pokemon-A')).toHaveAttribute('alt', 'Pikachu');
  await expect(page.getByTestId('menu-fight')).toBeEnabled(); // the opening send-outs have played
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
  // A later message (a critical hit, say) may replace it, so check the log rather than the current text.
  expect(await battleLog(page)).toContain(`text:PIKACHU used ${selectedId!.split('-').slice(2).join(' ').toUpperCase()}!`);
  const after = await hpValues();
  await page.clock.fastForward(30_000);
  expect(await hpValues()).toEqual(after);
  await page.screenshot({ path: 'test-results/showdown-manual-desktop.png', fullPage: true, caret: 'initial' });
  await page.getByRole('button', { name: 'Reset battle', exact: true }).click();
  await expect(page.getByTestId('menu-fight')).toBeEnabled(); // the opening replays first
  expect(await hpValues()).toEqual(before);
  await finishBattle(page);
  await expect(page.getByTestId('result')).toBeVisible();
  await expect(page.getByTestId('result').locator('img')).toHaveCount(1); // the winner's sprite
  await page.getByRole('button', { name: 'REMATCH', exact: true }).click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  await finishBattle(page);
  await page.getByRole('button', { name: 'EDIT TEAMS', exact: true }).click();
  await page.getByRole('button', { name: 'RESET', exact: true }).click();
  await expect(page.locator('[data-testid^="slot-"]')).toHaveCount(0);
  await expect(page.getByTestId('arena-preview').locator('img')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('move menus show PP and mark stat moves instead of a power', async ({ page }) => {
  await page.route('**/api/pokemon/*', async route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)!);
    const base = pokemon(name);
    await route.fulfill({ json: { ...base, movePool: [...base.movePool,
      { name: 'swords-dance', power: 0, accuracy: null, type: 'normal', damageClass: 'status', pp: 20, target: 'self', statChanges: [{ stat: 'atk', change: 2 }], learnMethods: ['level-up'] }] } });
  });
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  const panel = page.getByRole('region', { name: /My team/ });
  await expect(panel.locator('option[value="swords-dance"]').first()).toHaveText('SWORDS DANCE (—) PP 20');
  await expect(panel.locator('option[value="tackle"]').first()).toHaveText('TACKLE (40) PP 10');
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
  await page.getByTestId('menu-fight').tap();
  await expect(page.locator('[data-testid^="move-"]')).toHaveCount(4);
  await page.locator('[data-testid^="move-"]:enabled').first().tap();
  await expect.poll(mobileHp).not.toEqual(beforeAttack);
  await expect(page.getByTestId('turn-label')).toBeVisible({ timeout: 30_000 }); // the menu is back after the turn
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
      await page.getByTestId('menu-fight').tap();
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

test.describe('phone battle layout', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  test('phone shows the screen and its text-box menu without scrolling during battle', async ({ page }) => {
    await page.goto('/showdown');
    await add(page, 'A', 'pikachu');
    await add(page, 'B', 'blastoise');
    await page.getByTestId('battle-start').tap();
    await expect(page.getByTestId('menu-fight')).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByTestId('text-box')).toBeInViewport({ ratio: 1 });
    await expect(page.getByTestId('menu-fight')).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= 390)).toBe(true);
  });
});

test('desktop battle screen and result grow to fill a large window', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  const stage = await page.getByTestId('battle-stage').boundingBox();
  expect(stage!.width).toBeGreaterThan(860);
  expect(stage!.width).toBeLessThanOrEqual(881);
  await finishBattle(page);
  await page.clock.fastForward(5_000);
  const result = await page.getByTestId('result').boundingBox();
  expect(result!.width).toBeGreaterThan(860);
  expect(result!.width).toBeLessThanOrEqual(881);
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
  await page.getByTestId('move-A-tackle').hover();
  await expect(page.getByTestId('fight-info')).toContainText('PP 10/10');
  await expect(page.getByTestId('fight-info')).toContainText('TYPE/NORMAL');
  await expect(page.getByTestId('text-box').getByTestId('move-A-tackle')).toBeVisible(); // the moves sit in the text box
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

test('a turn played with the keyboard keeps focus on an enabled menu button', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await page.getByTestId('battle-start').click();
  const fight = page.getByTestId('menu-fight');
  await expect(fight).toBeEnabled({ timeout: 30_000 });
  await fight.focus();
  // Arrow keys move the cursor like the D-pad; Escape backs out of a submenu.
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('menu-pokemon')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(fight).toBeFocused();
  await page.keyboard.press('Enter');
  const move = page.locator('[data-testid^="move-A-"]:enabled').first();
  await expect(move).toBeFocused(); // FIGHT unmounted; focus moved into the move list
  await page.keyboard.press('Escape');
  await expect(fight).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(move).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid^="move-"]:enabled')).toHaveCount(0);
  await expect(fight).toBeEnabled({ timeout: 60_000 }); // playback done
  await expect(fight).toBeFocused();
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
  // A lone strong Pikachu one-shots the weak foes, so the first faint is deterministic.
  await page.unroute('**/api/pokemon/*');
  await page.route('**/api/pokemon/*', async route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)!);
    const base = pokemon(name);
    const strong = name === 'pikachu';
    const stat = strong ? 250 : 20;
    await route.fulfill({ json: {
      ...base, baseStats: { hp: strong ? 100 : 20, atk: stat, def: stat, spa: stat, spd: stat, spe: stat },
      movePool: base.movePool.map(move => ({ ...move, power: 250 })),
    } });
  });
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await add(page, 'B', 'gengar');
  await page.clock.install();
  await page.getByTestId('battle-start').click();
  await openFight(page);
  await page.locator('[data-testid^="move-A-"]:enabled').first().click();
  await finishAttack(page);
  // The foe fainted: the bottom screen asks side B which Pokémon to send out.
  await expect(page.getByTestId('turn-label')).toHaveText("RIVAL'S TURN");
  await expect(page.getByText('Send out which Pokémon?')).toBeVisible();
  await expect(page.locator('[data-testid^="party-B-"]')).toHaveCount(2);
  await expect(page.getByTestId('party-B-0')).toBeDisabled(); // fainted
  await expect(page.getByTestId('party-B-0')).toContainText('FAINTED');
  await expect(page.getByTestId('party-B-1')).toBeEnabled();
  await expect(page.getByTestId('menu-back')).toHaveCount(0);
  await expect(page.getByTestId('menu-fight')).toHaveCount(0);
  await page.getByTestId('party-B-1').click();
  await expect(page.locator('[data-testid^="party-"]:enabled')).toHaveCount(0); // inert while playing
  await page.clock.fastForward(10_000);
  // Gengar is on the field at full HP, Pikachu is untouched (the foe did not act), and a new round starts.
  await expect(page.getByTestId('arena-pokemon-B')).toHaveAttribute('alt', 'Gengar');
  const full = async (side: 'A' | 'B') => page.getByTestId(`hp-box-${side}`).getByRole('progressbar').evaluate(bar => bar.getAttribute('aria-valuenow') === bar.getAttribute('aria-valuemax'));
  await expect(page.getByTestId('hp-box-B')).toContainText('GENGAR');
  expect(await full('B')).toBe(true);
  expect(await full('A')).toBe(true);
  await expect(page.getByTestId('turn-label')).toHaveText('YOUR TURN');
  await expect(page.getByTestId('menu-fight')).toBeVisible();
  await expect(page.locator('[data-testid^="party-"]')).toHaveCount(0);
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

test('opening sends out both Pokémon with ball throws', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  const start = new Date('2026-10-23T10:00:00Z').getTime();
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start + 10_000);
  await watchBattle(page);
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  // Flash, slide-in, then both send-outs: about 3.6 s before the first command. (Small steps let React schedule each next timer.)
  const run = async (ms: number) => { for (let t = 0; t < ms; t += 50) await page.clock.runFor(50); };
  await run(3_300);
  await expect(page.getByTestId('menu-fight')).toHaveCount(0); // the text box still shows the send-out messages
  await run(500);
  await expect(page.getByTestId('menu-fight')).toBeEnabled();
  const log = await battleLog(page);
  const at = (entry: string) => log.indexOf(entry);
  expect(at('text:RIVAL sent out BLASTOISE!')).toBeGreaterThan(-1);
  expect(at('text:RIVAL sent out BLASTOISE!')).toBeLessThan(at('text:Go! PIKACHU!'));
  expect(at('pokeball-throw-B')).toBeGreaterThan(-1);
  expect(at('pokeball-throw-B')).toBeLessThan(at('arena-pokemon-B'));
  expect(at('arena-pokemon-B')).toBeLessThan(at('pokeball-throw-A'));
  expect(at('pokeball-throw-A')).toBeLessThan(at('arena-pokemon-A'));
  await expect(page.locator('[data-testid^="pokeball-throw-"]')).toHaveCount(0);
  await expect(page.getByTestId('text-box')).toContainText('What will PIKACHU do?');
});

test('skip finishes the step without losing events', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  const start = new Date('2026-10-23T10:00:00Z').getTime();
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start + 10_000);
  await watchBattle(page);
  const hp = () => page.getByRole('progressbar').evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-valuenow')));
  const typed = () => page.getByTestId('text-box').locator('p[aria-hidden]').textContent();
  const full = () => page.getByTestId('text-box').locator('[aria-live]').textContent();
  const foe = async () => ({
    shown: Number(await page.getByTestId('hp-number-B').textContent()),
    now: Number(await page.getByTestId('hp-box-B').getByRole('progressbar').getAttribute('aria-valuenow')),
  });
  // The menu is back for the next command (menu-fight is only rendered while the main menu is open).
  const ready = async () => (await page.getByTestId('menu-fight').count()) > 0 && page.getByTestId('menu-fight').isEnabled();
  const run = async (taps: boolean) => {
    // Date.now is frozen at the same instant for both runs, so both battles get the same seed.
    await page.clock.setSystemTime(start + 10_000);
    await page.getByTestId('battle-start').click();
    for (let i = 0; i < 100 && !(await ready()); i++) await page.clock.runFor(100);
    await page.getByTestId('menu-fight').click();
    await clearBattleLog(page);
    await page.locator('[data-testid^="move-A-"]').last().click();
    let drainSkipped = false;
    let tapped = 0;
    for (let t = 50; t <= 12_000; t += 50) {
      await page.clock.runFor(50);
      // Five taps, one every 100 ms of clock, while the attack is still playing.
      if (taps && tapped < 5 && t % 100 === 0 && !(await ready())) {
        tapped++;
        const before = await foe();
        await page.getByTestId('text-box').tap();
        // The clock is paused, so only the skip can have finished the typing.
        expect(await typed()).toBe(await full());
        await page.clock.runFor(20); // one frame for the HP bar to jump
        const after = await foe();
        // Unless the next hit landed during that frame, the bar now shows its target.
        if (after.now === before.now) {
          expect(after.shown).toBe(after.now);
          if (before.shown !== before.now) drainSkipped = true;
        }
      }
      if (await ready()) break;
    }
    await expect(page.getByTestId('menu-fight')).toBeEnabled();
    if (taps) {
      expect(tapped).toBe(5);
      expect(drainSkipped).toBe(true);
    }
    return { log: await battleLog(page), hp: await hp() };
  };
  const plain = await run(false);
  expect(plain.log.filter(entry => entry.startsWith('text:')).length).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Edit teams', exact: true }).click();
  const tapped = await run(true);
  expect(tapped.log).toEqual(plain.log);
  expect(tapped.hp).toEqual(plain.hp);
});

test('tapping through the opening is fast', async ({ page }) => {
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  const start = new Date('2026-10-23T10:00:00Z').getTime();
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start + 10_000);
  await watchBattle(page);
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('battle-stage')).toBeVisible();
  // Untapped, the opening takes about 3.6 s of clock (see the test above); tapping every 100 ms skips each step.
  let elapsed = 0;
  while (elapsed < 5_000 && !(await page.getByTestId('menu-fight').count())) {
    await page.clock.runFor(50);
    elapsed += 50;
    if (elapsed % 100 === 0) await page.getByTestId('text-box').tap();
  }
  await expect(page.getByTestId('menu-fight')).toBeEnabled();
  expect(elapsed).toBeLessThan(2_000);
  // Both send-outs still played, in order.
  const log = await battleLog(page);
  expect(log.indexOf('text:RIVAL sent out BLASTOISE!')).toBeGreaterThan(-1);
  expect(log.indexOf('text:RIVAL sent out BLASTOISE!')).toBeLessThan(log.indexOf('text:Go! PIKACHU!'));
  await expect(page.getByTestId('arena-pokemon-A')).toBeVisible();
  await expect(page.getByTestId('arena-pokemon-B')).toBeVisible();
});

test('reduced motion shows no throw', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showdown');
  await add(page, 'A', 'pikachu');
  await add(page, 'B', 'blastoise');
  await watchBattle(page);
  await page.getByTestId('battle-start').click();
  await expect(page.getByTestId('menu-fight')).toBeEnabled();
  await expect(page.getByTestId('arena-pokemon-B')).toBeVisible();
  await page.getByTestId('menu-fight').click();
  await page.locator('[data-testid^="move-A-"]').first().click();
  await expect(page.getByTestId('menu-fight')).toBeEnabled();
  const log = await battleLog(page);
  expect(log).toContain('arena-pokemon-B');
  expect(log).toContain('arena-pokemon-A');
  expect(log.filter(entry => entry.startsWith('pokeball-throw') || entry === 'battle-fx')).toEqual([]);
});
