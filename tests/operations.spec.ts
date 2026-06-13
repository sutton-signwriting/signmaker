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
