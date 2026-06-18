import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

test.describe('palette tooltips', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
  });

  test('a palette symbol tooltip sits above the cell, nudged into the row gap', async ({ page }) => {
    const cell = page.locator('#palette .row button:not([disabled])').first();
    await cell.hover();
    const bubble = page.locator('.tip-bubble');
    await expect(bubble).toBeVisible();
    const c = (await cell.boundingBox())!;
    const b = (await bubble.boundingBox())!;
    expect(b.y).toBeLessThan(c.y); // anchored above the cell top (hovered symbol stays visible)
    expect(b.y + b.height).toBeGreaterThan(c.y); // but nudged down into the gap, not floating high above
  });

  test('select mode shows the focused cell tooltip as the cursor moves', async ({ page }) => {
    await page.keyboard.press('s');
    const bubble = page.locator('.tip-bubble');
    const focusedTip = () => page.locator('#palette .row button.focused').getAttribute('data-tip');
    // Walk right until the cursor lands on a labelled cell, then the bubble should mirror its label.
    for (let i = 0; i < 8 && !(await focusedTip()); i++) await page.keyboard.press('ArrowRight');
    const tip = await focusedTip();
    expect(tip).toBeTruthy();
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveText(tip!);
  });
});
