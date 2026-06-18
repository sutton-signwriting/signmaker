import { test, expect } from '@playwright/test';
import { waitForApp, vm } from './support';

// Dragging must not re-render the symbol list per move: that path recreated a ResizeObserver and
// re-measured every symbol on each pointermove (121 observers for 120 moves) and animated left/top,
// which is what made dragging choppy over a video on low-end machines. Symbols now move by transform
// and commit once on drop, so a whole drag should create zero observers.
test('dragging does not thrash ResizeObservers (smooth drag regression guard)', async ({ page }) => {
  await page.goto('/index.html');
  await waitForApp(page);
  for (let i = 0; i < 8; i++) await vm(page, 'add', { key: 'S10000', x: 400 + i * 12, y: 400 + i * 8 });

  await page.evaluate(() => {
    const w = window as any;
    w.__ro = 0;
    const RO = window.ResizeObserver;
    window.ResizeObserver = class extends RO { constructor(cb: any) { super(cb); w.__ro++; } } as any;
    w.__longtasks = 0; w.__longtime = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { w.__longtasks++; w.__longtime += e.duration; } })
      .observe({ entryTypes: ['longtask'] });
  });

  const sym = page.locator('#signbox .signbox-symbol').first();
  const box = (await sym.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  const t0 = Date.now();
  for (let i = 0; i < 120; i++) {
    await page.mouse.move(box.x + 10 + Math.sin(i / 6) * 80, box.y + 10 + Math.cos(i / 6) * 80);
  }
  const wall = Date.now() - t0;
  await page.mouse.up();

  const stats = await page.evaluate(() => {
    const w = window as any;
    return { ro: w.__ro, longtasks: w.__longtasks, longtime: Math.round(w.__longtime) };
  });
  console.log(`DRAG PERF: wall=${wall}ms moves=120 ResizeObservers=${stats.ro} longTasks=${stats.longtasks} longTaskMs=${stats.longtime}`);
  expect(stats.ro).toBe(0);
});
