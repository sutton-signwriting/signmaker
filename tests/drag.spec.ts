import { test, expect } from '@playwright/test';
import { waitForApp, fswlive, symbolCount } from './support';

async function dragPaletteSymbolToSignbox(page: import('@playwright/test').Page, fx: number, fy: number) {
  const svg = page.locator('#palette .row svg').first();
  await svg.waitFor();
  const from = await svg.boundingBox();
  const box = await page.locator('#signbox').boundingBox();
  if (!from || !box) throw new Error('missing palette symbol or signbox');
  const to = { x: box.x + box.width * fx, y: box.y + box.height * fy };
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  return to;
}

test.describe('palette drag-and-drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
  });

  test('dragging a palette symbol onto the signbox adds one symbol', async ({ page }) => {
    await dragPaletteSymbolToSignbox(page, 0.45, 0.4);
    expect(symbolCount(await fswlive(page))).toBe(1);
  });

  test('rubber-band selects multiple symbols and group ops apply to all', async ({ page }) => {
    await page.evaluate(() => {
      const vm = (window as unknown as { signmaker: { vm: { clear: () => void; add: (s: object) => void } } }).signmaker.vm;
      vm.clear();
      vm.add({ key: 'S10000', x: 470, y: 480 });
      vm.add({ key: 'S10011', x: 525, y: 510 });
    });
    const box = await page.locator('#signbox').boundingBox();
    if (!box) throw new Error('no signbox');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 110, cy - 110);
    await page.mouse.down();
    await page.mouse.move(cx + 110, cy + 110, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('#signbox .selected')).toHaveCount(2);

    await page.locator('body').press('Delete');
    expect(symbolCount(await fswlive(page))).toBe(0);
  });

  test('duplicating a multi-selection selects all the new copies', async ({ page }) => {
    await page.evaluate(() => {
      const vm = (window as unknown as { signmaker: { vm: { clear: () => void; add: (s: object) => void } } }).signmaker.vm;
      vm.clear();
      vm.add({ key: 'S10000', x: 470, y: 480 });
      vm.add({ key: 'S10011', x: 525, y: 510 });
    });
    const box = await page.locator('#signbox').boundingBox();
    if (!box) throw new Error('no signbox');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 110, cy - 110);
    await page.mouse.down();
    await page.mouse.move(cx + 110, cy + 110, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('#signbox .selected')).toHaveCount(2);

    await page.evaluate(() => (window as unknown as { signmaker: { vm: { copy: () => void } } }).signmaker.vm.copy());
    expect(symbolCount(await fswlive(page))).toBe(4);
    await expect(page.locator('#signbox .selected')).toHaveCount(2); // the new copies, not the originals
  });

  test('mirroring a multi-selection reflects positions and is its own inverse', async ({ page }) => {
    await page.evaluate(() => {
      const vm = (window as unknown as { signmaker: { vm: { clear: () => void; add: (s: object) => void } } }).signmaker.vm;
      vm.clear();
      vm.add({ key: 'S10000', x: 430, y: 500 });
      vm.add({ key: 'S10011', x: 560, y: 500 });
    });
    const box = await page.locator('#signbox').boundingBox();
    if (!box) throw new Error('no signbox');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 110, cy - 110);
    await page.mouse.down();
    await page.mouse.move(cx + 110, cy + 110, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('#signbox .selected')).toHaveCount(2);

    const mirror = () => page.evaluate(() => (window as unknown as { signmaker: { vm: { mirror: () => void } } }).signmaker.vm.mirror());
    const before = await fswlive(page);
    await mirror();
    expect(await fswlive(page)).not.toBe(before); // glyphs and positions both change
    await mirror();
    expect(await fswlive(page)).toBe(before); // mirror is its own inverse
  });

  test('rotating a multi-selection rotates the group around its center', async ({ page }) => {
    await page.evaluate(() => {
      const vm = (window as unknown as { signmaker: { vm: { clear: () => void; add: (s: object) => void } } }).signmaker.vm;
      vm.clear();
      vm.add({ key: 'S10000', x: 450, y: 480 });
      vm.add({ key: 'S10011', x: 560, y: 520 });
    });
    const box = await page.locator('#signbox').boundingBox();
    if (!box) throw new Error('no signbox');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 120, cy - 120);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy + 120, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('#signbox .selected')).toHaveCount(2);

    const before = await fswlive(page);
    await page.evaluate(() => (window as unknown as { signmaker: { vm: { rotate: (n: number) => void } } }).signmaker.vm.rotate(1));
    const after = await fswlive(page);
    expect(after).not.toBe(before); // positions and glyphs rotate
    expect(symbolCount(after)).toBe(2);
  });

  test('adding a generated sign appends it (selected), not replacing', async ({ page }) => {
    await page.evaluate(() => {
      const vm = (window as unknown as { signmaker: { vm: { clear: () => void; add: (s: object) => void; addSign: (f: string) => void } } }).signmaker.vm;
      vm.clear();
      vm.add({ key: 'S10000', x: 500, y: 500 });
      vm.addSign('M515x563S11502477x437S14a20492x457S1dc20484x477');
    });
    expect(symbolCount(await fswlive(page))).toBe(4); // 1 original + 3 added, box marker dropped
    await expect(page.locator('#signbox .selected')).toHaveCount(3); // only the added symbols
  });

  test('dropped symbol is centered at the drop point', async ({ page }) => {
    const drop = await dragPaletteSymbolToSignbox(page, 0.5, 0.45);
    const placed = page.locator('#signbox .selected').first();
    await placed.waitFor();
    const r = await placed.boundingBox();
    if (!r) throw new Error('placed symbol not found');
    expect(Math.abs(r.x + r.width / 2 - drop.x)).toBeLessThan(20);
    expect(Math.abs(r.y + r.height / 2 - drop.y)).toBeLessThan(20);
  });
});
