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
  const pressChar = (page: import('@playwright/test').Page, key: string) =>
    page.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })), key);

  // rotate ('/','?') wraps and mirror (',') toggles, so they change a fresh symbol directly.
  for (const key of ['/', '?', ','] as const) {
    test(`'${key}' transforms the selected symbol regardless of keyCode`, async ({ page }) => {
      const before = await fswlive(page);
      await pressChar(page, key);
      expect(await fswlive(page)).not.toBe(before);
    });
  }

  // Variation is bounded, so step forward ('.') before testing the backward step ('>').
  test(`variation '.' and '>' both fire regardless of keyCode`, async ({ page }) => {
    const start = await fswlive(page);
    await pressChar(page, '.');
    const forward = await fswlive(page);
    expect(forward).not.toBe(start);
    await pressChar(page, '>');
    expect(await fswlive(page)).not.toBe(forward);
  });
});
