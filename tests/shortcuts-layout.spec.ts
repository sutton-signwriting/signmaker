import { test, expect } from '@playwright/test';
import { waitForApp, fswlive, vm } from './support';

// Regression: shortcuts used to match event.keyCode, which reports US physical key positions, so
// punctuation shortcuts (rotate '/', variation '.', mirror ',') fired on the wrong keys under
// layouts like ABNT2 (Brazilian). Matching event.key — the character actually typed — fixes it.
test.describe('layout-independent shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
  });

  // Dispatch the character with a keyCode that is NOT the US position (0) — what a foreign-layout key
  // sends. Old keyCode matching would miss it; event.key matching catches it.
  const pressChar = (page: import('@playwright/test').Page, key: string, meta = false) =>
    page.evaluate(
      ({ k, m }) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, metaKey: m, bubbles: true, cancelable: true })),
      { k: key, m: meta },
    );

  // rotate ('/','?'), mirror (','), fill ('n') change a fresh symbol directly.
  for (const key of ['/', '?', ',', 'n'] as const) {
    test(`'${key}' transforms the selected symbol regardless of keyCode`, async ({ page }) => {
      const before = await fswlive(page);
      await pressChar(page, key);
      expect(await fswlive(page)).not.toBe(before);
    });
  }

  // Bounded/back steps: step forward first, then assert the backward step also fires.
  for (const [forward, back] of [['.', '>'], ['n', 'N']] as const) {
    test(`'${forward}'/'${back}' both fire regardless of keyCode`, async ({ page }) => {
      const start = await fswlive(page);
      await pressChar(page, forward);
      const stepped = await fswlive(page);
      expect(stepped).not.toBe(start);
      await pressChar(page, back);
      expect(await fswlive(page)).not.toBe(stepped);
    });
  }

  // Send-back uses ⌘/Ctrl + the shifted bracket char. The freshly-added symbol is selected and last,
  // so '{' (send to back) moves it to the front — an observable reorder.
  test(`'{' (⌘) reorders regardless of keyCode`, async ({ page }) => {
    await vm(page, 'add', { key: 'S10001', x: 520, y: 480 });
    const before = await fswlive(page);
    await pressChar(page, '{', true);
    expect(await fswlive(page)).not.toBe(before);
  });
});
