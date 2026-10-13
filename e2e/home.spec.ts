import { test, expect } from '@playwright/test';

test('home opens on the site name and description', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('HIPOKÉMON');
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

type Page = import('@playwright/test').Page;
const opacity = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate(el => Number(getComputedStyle(el).opacity));
/** Scroll to a fraction of the desktop sequence and wait until it lands. */
const scrollToProgress = async (page: Page, p: number) => {
  // Wait for the pin first: before it the page is shorter and the scroll would clamp.
  await expect(page.locator('section[data-sequenced]')).toBeAttached();
  const target = await page.evaluate(p => {
    const y = Math.round(window.innerHeight * 3 * p);
    window.scrollTo(0, y);
    return y;
  }, p);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(target - 2);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(target + 2);
};
/** Waits a couple of frames, so effects and teardowns that run on the next frame have run. */
const nextFrames = (page: Page) =>
  page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.describe('scroll sequence (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('welcome → grail → turn → doors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
    await page.goto('/');
    await expect(page.locator('[data-glitter]')).toBeVisible();
    expect(await opacity(page, '[data-grail-card]')).toBe(0);

    await scrollToProgress(page, 0.25);
    await expect.poll(() => opacity(page, '[data-part="welcome"]')).toBe(0);
    await expect.poll(() => opacity(page, '[data-grail-card]')).toBe(1);
    await expect.poll(() => opacity(page, '[data-part="grailCopy"]')).toBe(1);

    await scrollToProgress(page, 0.5);
    await expect.poll(() => opacity(page, '[data-caption="1"]')).toBe(1);

    await scrollToProgress(page, 1);
    await expect.poll(() => opacity(page, '[data-grail-card]')).toBe(0);
    await expect.poll(() => opacity(page, '[data-vault-card]')).toBe(1);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test('tabbing to a door jumps to the end of the sequence', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Enter the vault/ }).focus();
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    await expect.poll(() => opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('tabbing to a door right after the pin starts also lands on the end', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section[data-sequenced]')).toBeAttached();
    await page.getByRole('link', { name: /Enter the vault/ }).focus();
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
    await expect.poll(() => opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('End key lands cleanly on the doors', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await expect.poll(() => opacity(page, '[data-grail-card]')).toBe(0);
    await expect.poll(() => opacity(page, '[data-vault-card]')).toBe(1);
  });

  test('after a resize at the end, the card slot still matches the Vault door', async ({ page }) => {
    await page.goto('/');
    await scrollToProgress(page, 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    // ScrollTrigger refreshes after the resize: the pin spacer becomes the new viewport + 3 viewports of scroll.
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLElement>('.pin-spacer')?.offsetHeight)).toBe(768 * 4);
    await scrollToProgress(page, 0.99);
    const offset = async () => {
      const [card, door] = await Promise.all([
        page.locator('[data-grail-card]').boundingBox(),
        page.locator('[data-door-card]').boundingBox(),
      ]);
      return Math.max(
        Math.abs(card!.x + card!.width / 2 - (door!.x + door!.width / 2)),
        Math.abs(card!.y + card!.height / 2 - (door!.y + door!.height / 2)),
      );
    };
    await expect.poll(offset).toBeLessThan(12);
  });

  test('leaving for the Vault stops the sequence without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await scrollToProgress(page, 1);
    await page.getByRole('link', { name: /Enter the vault/ }).click();
    await expect(page).toHaveURL(/\/cards$/);
    await expect(page.locator('[data-glitter]')).toHaveCount(0);
    await nextFrames(page); // the sequence teardown and the canvases' last frames
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
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  test('native scrolling, readable copy, direct links, and tap-to-flip work', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section[data-sequenced]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Browse the Vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Play Showdown/ })).toBeInViewport({ ratio: 1 });
    expect(await page.locator('[data-part="welcome"] .copy').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    for (const link of await page.getByRole('navigation', { name: 'Main' }).getByRole('link').all()) {
      if (await link.isVisible()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: 'test-results/home-mobile-welcome.png', animations: 'disabled' });
    await page.getByRole('button', { name: /Flip the card/ }).tap();
    await expect(page.locator('[data-grail-card]')).toHaveAttribute('data-flipped', 'true');
    await page.getByRole('button', { name: /Show card front/ }).tap();
    await expect(page.locator('[data-grail-card]')).toHaveAttribute('data-flipped', 'false');
    await page.getByRole('link', { name: /Enter the vault/ }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: 'test-results/home-mobile-full.png', fullPage: true, animations: 'disabled' });
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const [vault, arena] = await Promise.all(['vault', 'showdown'].map(door => page.locator(`[data-door="${door}"]`).boundingBox()));
      expect(overlaps(vault!, arena!)).toBe(false);
      expect(arena!.x + arena!.width).toBeLessThanOrEqual(viewport.width);
    }
    await page.getByRole('link', { name: /Browse the Vault/ }).tap();
    await expect(page).toHaveURL(/\/cards$/);
    await page.goto('/');
    await page.getByRole('link', { name: /Play Showdown/ }).tap();
    await expect(page).toHaveURL(/\/showdown$/);
  });
});

test('resizing between desktop and mobile clears pinned styles and restores the sequence', async ({ page }) => {
  await page.goto('/');
  await scrollToProgress(page, .5);
  await expect.poll(() => opacity(page, '[data-part="welcome"]')).toBe(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('section[data-sequenced]')).toHaveCount(0);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect.poll(() => opacity(page, '[data-part="welcome"]')).toBe(1);
  await expect(page.locator('[data-part="welcome"]')).not.toHaveAttribute('inert');
  await expect(page.getByRole('link', { name: /Browse the Vault/ })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await scrollToProgress(page, 1);
  await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport();
});

test.describe('tablet portrait', () => {
  test.use({ viewport: { width: 820, height: 1180 } });
  test('the doors title stays clear of the doors and both links fit', async ({ page }) => {
    await page.goto('/');
    await scrollToProgress(page, 1);
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
    const title = page.getByRole('heading', { level: 2, name: /Choose your door/ });
    await expect(title).toBeInViewport({ ratio: 1 });
    const titleBox = (await title.boundingBox())!;
    expect(titleBox.width).toBeGreaterThan(200); // the 400px column used to collapse to 12-64px
    for (const door of ['[data-door="vault"]', '[data-door="showdown"]']) {
      expect(overlaps(titleBox, (await page.locator(door).boundingBox())!)).toBe(false);
    }
  });
});

test.describe('short landscape (phone on its side)', () => {
  test.use({ viewport: { width: 812, height: 375 }, isMobile: true, hasTouch: true });
  test('landscape keeps natural scrolling, card controls, and both doors accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section[data-sequenced]')).toHaveCount(0);
    // The nav text ends about 54px down; the welcome meta row must start below it.
    const welcomeMeta = (await page.locator('[data-part="welcome"] .meta').first().boundingBox())!;
    expect(welcomeMeta.y).toBeGreaterThanOrEqual(60);

    await page.getByRole('button', { name: /Flip the card/ }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: /Flip the card/ })).toBeInViewport({ ratio: 1 });
    const headline = (await page.locator('[data-part="headline"]').boundingBox())!;
    const copy = (await page.locator('[data-part="grailCopy"]').boundingBox())!;
    expect(overlaps(headline, copy)).toBe(false);

    await page.getByRole('link', { name: /Enter the vault/ }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: /Enter the vault/ })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: /Enter the arena/ })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  test('shows the static page: the heading and both door links', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    // toBeVisible ignores opacity and covering layers, so check the heading is really painted.
    const painted = () => h1.evaluate(el => {
      let alpha = 1;
      for (let n: Element | null = el; n; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity);
      // Any fixed layer drawn over the heading (the page curtain is pointer-events: none, so hit tests miss it).
      const r = el.getBoundingClientRect();
      const [x, y] = [r.left + r.width / 2, r.top + r.height / 2];
      const covered = [...document.querySelectorAll('body *')].some(n => {
        const cs = getComputedStyle(n);
        if (cs.position !== 'fixed' || !(Number(cs.zIndex) > 0) || n.contains(el)) return false;
        const b = n.getBoundingClientRect();
        return b.height > 1 && b.left <= x && x <= b.right && b.top <= y && y <= b.bottom && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
      });
      return alpha === 1 && !covered;
    });
    await expect.poll(painted).toBe(true);
    for (const name of [/Enter the vault/, /Enter the arena/]) {
      const link = page.getByRole('link', { name });
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
      await expect(link).toBeInViewport();
    }
  });
});
