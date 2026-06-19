import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

// Only the glyph fonts (Line + Fill) load eagerly; OneD is deferred (Settings-only) to save ~8MB.
const SIGNWRITING_FONTS = ['SuttonSignWritingLine', 'SuttonSignWritingFill'];

test.describe('SignWriting fonts', () => {
  // Regression: font-ttf renders empty glyphs until the SignWriting fonts load,
  // but nothing requested them (canvas measuring never triggers @font-face
  // loading), so glyphs stayed as empty boxes until an unrelated interaction
  // forced a re-render. The app now loads the fonts on startup and glyph
  // components render reactively once ready.
  test('loads the glyph fonts and renders symbols without any interaction', async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);

    await expect
      .poll(
        () =>
          page.evaluate(
            (families) => families.every((f) => document.fonts.check(`1em "${f}"`)),
            SIGNWRITING_FONTS,
          ),
        { timeout: 15000 },
      )
      .toBe(true);

    // A palette symbol paints real glyph content with no click/drag first.
    await expect(page.locator('#palette .row svg').first()).toBeVisible();
  });
});
