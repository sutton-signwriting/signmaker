import { test, expect } from '@playwright/test';
import { waitForApp, fswlive, fswnorm, symbolCount, vm, SYMBOL_PATTERN, SIGNS } from './support';

test.describe('symbol operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
  });

  test('add places symbols', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await vm(page, 'add', { key: 'S10010', x: 510, y: 490 });
    expect(symbolCount(await fswlive(page))).toBe(2);
  });

  test('delete removes the selected symbol', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await vm(page, 'delete');
    expect(await fswlive(page)).toBe('');
  });

  test('copy duplicates the selected symbol', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await vm(page, 'copy');
    expect(symbolCount(await fswlive(page))).toBe(2);
  });

  test('clear empties the signbox', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await vm(page, 'add', { key: 'S10010', x: 510, y: 490 });
    await vm(page, 'clear');
    expect(await fswlive(page)).toBe('');
  });

  for (const op of ['mirror', 'rotate', 'variation', 'fill'] as const) {
    test(`${op} transforms the selected symbol key`, async ({ page }) => {
      await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
      const before = await fswlive(page);
      await vm(page, op, ...(op === 'mirror' ? [] : [1]));
      const after = await fswlive(page);
      expect(symbolCount(after)).toBe(1);
      expect(after).not.toBe(before);
    });
  }

  test('move shifts the selected symbol', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    const before = await fswlive(page);
    await vm(page, 'move', 10, 0);
    expect(await fswlive(page)).not.toBe(before);
  });

  test('undo and redo step through history', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await vm(page, 'add', { key: 'S10010', x: 510, y: 490 });
    expect(symbolCount(await fswlive(page))).toBe(2);
    await vm(page, 'undo');
    expect(symbolCount(await fswlive(page))).toBe(1);
    await vm(page, 'redo');
    expect(symbolCount(await fswlive(page))).toBe(2);
  });

  test('symmetric duplicate mirrors a symbol across the center axis', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 560, y: 400 }); // left edge 60 right of center
    await vm(page, 'symmetricDuplicate');
    const syms = page.locator('#signbox .signbox-symbol');
    await expect(syms).toHaveCount(2);
    const center = (await page.locator('.valid-range').boundingBox())!.x + 250;
    const a = (await syms.nth(0).boundingBox())!;
    const b = (await syms.nth(1).boundingBox())!;
    // original's left edge and the copy's right edge sit equidistant on opposite sides of center.
    expect(Math.abs(a.x - center + (b.x + b.width - center))).toBeLessThanOrEqual(1);
    expect(Math.round(a.y)).toBe(Math.round(b.y));
    await expect(syms.nth(1)).toHaveClass(/selected/);
  });

  test('Cmd+Shift+D symmetric-duplicates rather than a plain copy', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 560, y: 430 }); // right of center, selected
    const center = (await page.locator('.valid-range').boundingBox())!.x + 250;
    await page.keyboard.press('Meta+Shift+D');
    const syms = page.locator('#signbox .signbox-symbol');
    await expect(syms).toHaveCount(2);
    const a = (await syms.nth(0).boundingBox())!;
    const b = (await syms.nth(1).boundingBox())!;
    // The copy lands on the opposite side of the axis; a plain ⌘D copy would stay on the same side.
    expect(Math.sign(a.x + a.width / 2 - center)).not.toBe(Math.sign(b.x + b.width / 2 - center));
  });

  test('S enters select mode, navigates the palette, and adds a symbol', async ({ page }) => {
    await page.keyboard.press('s');
    await expect(page.locator('.palette-num')).toHaveCount(10); // category numbers 1–9,0
    await expect(page.locator('#arrow-up')).toBeDisabled(); // canvas arrow pad inert in select mode
    await expect(page.locator('#palette .row button.focused')).toHaveCount(1);
    // Drill top -> group -> base, then the leaf Enter drops it centered and exits.
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator('#signbox .signbox-symbol')).toHaveCount(1);
    await expect(page.locator('#signbox .signbox-symbol.selected')).toHaveCount(1);
    await expect(page.locator('.palette-num')).toHaveCount(0); // select mode exited
  });

  test('clicking a leaf symbol (no submenu) adds it to the canvas', async ({ page }) => {
    const first = () => page.locator('#palette .row button:not([disabled])').first();
    await first().click(); // top -> group
    await first().click(); // group -> base
    await first().click(); // base leaf -> add, centered + selected
    await expect(page.locator('#signbox .signbox-symbol')).toHaveCount(1);
    await expect(page.locator('#signbox .signbox-symbol.selected')).toHaveCount(1);
  });

  test('S mode: Left at the first column steps back up a level', async ({ page }) => {
    await page.keyboard.press('s');
    await page.keyboard.press('Enter'); // top -> group
    await expect(page.locator('.palette-crumbs .crumb')).not.toHaveCount(0);
    await page.keyboard.press('ArrowLeft'); // at col 0 -> back to top
    await expect(page.locator('.palette-crumbs .crumb')).toHaveCount(0);
    await expect(page.locator('.palette-num')).toHaveCount(10); // still in select mode
  });

  test('S mode: Backspace steps back up a level', async ({ page }) => {
    await page.keyboard.press('s');
    await page.keyboard.press('Enter'); // top -> group
    await expect(page.locator('.palette-crumbs .crumb')).not.toHaveCount(0);
    await page.keyboard.press('Backspace'); // back to top
    await expect(page.locator('.palette-crumbs .crumb')).toHaveCount(0);
    await expect(page.locator('.palette-num')).toHaveCount(10); // still in select mode
  });

  test('selecting a canvas symbol leaves select mode', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await page.keyboard.press('s');
    await expect(page.locator('.palette-num')).toHaveCount(10);
    await page.locator('#signbox .signbox-symbol').first().click();
    await expect(page.locator('.palette-num')).toHaveCount(0); // select mode exited
    await expect(page.locator('#signbox .signbox-symbol.selected')).toHaveCount(1);
  });

  test('S clears the canvas selection and Escape exits select mode', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await expect(page.locator('#signbox .signbox-symbol.selected')).toHaveCount(1);
    await page.keyboard.press('s');
    await expect(page.locator('#signbox .signbox-symbol.selected')).toHaveCount(0);
    await expect(page.locator('.palette-num')).toHaveCount(10);
    await page.keyboard.press('Escape');
    await expect(page.locator('.palette-num')).toHaveCount(0);
  });

  test('Escape deselects symbols and does not open settings', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    expect(await page.locator('#signbox .signbox-symbol.selected').count()).toBe(1);
    await page.keyboard.press('Escape');
    expect(await page.locator('#signbox .signbox-symbol.selected').count()).toBe(0);
    await expect(page.locator('dialog.settings-dialog')).toBeHidden();
  });

  test('Escape closes an open dialog', async ({ page }) => {
    await page.locator('#tool-settings').click();
    await expect(page.locator('dialog.settings-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.settings-dialog')).toBeHidden();
  });

  test('addSeq writes a sorting sequence prefix', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await vm(page, 'addSeq', 'S10000', 0);
    expect(await fswnorm(page)).toMatch(/^AS10000/);
  });

  for (const [label, fsw] of Object.entries(SIGNS)) {
    test(`${label} signbox loads and normalizes with symbols`, async ({ page }) => {
      await page.goto(`/index.html#?fsw=${encodeURIComponent(fsw)}`);
      await waitForApp(page);
      const norm = await fswnorm(page);
      expect(norm).toMatch(SYMBOL_PATTERN);
      expect(norm).toMatch(new RegExp(`${label}[0-9]{3}x[0-9]{3}`));
    });
  }
});
