import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

test.describe('shortcut-learning overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
  });

  test('holding Cmd reveals shortcut-only badges, released on key up', async ({ page }) => {
    const undoTip = (await page.locator('#tool-undo').getAttribute('data-tip'))!; // e.g. "Undo (⌘Z)"
    const shortcut = undoTip.match(/\(([^)]+)\)/)![1];

    await expect(page.locator('.shortcut-badge')).toHaveCount(0);
    await page.keyboard.down('Meta');
    // Appears only after the ~2s hold.
    await expect(page.locator('.shortcut-badge').filter({ hasText: shortcut })).toBeVisible({ timeout: 3000 });
    expect(await page.locator('.shortcut-badge').count()).toBeGreaterThan(3);
    // Shows the shortcut, not the label word.
    await expect(page.locator('.shortcut-badge').filter({ hasText: 'Undo' })).toHaveCount(0);

    await page.keyboard.up('Meta');
    await expect(page.locator('.shortcut-badge')).toHaveCount(0);
  });

  test('pressing another key cancels the reveal before it shows', async ({ page }) => {
    await page.keyboard.down('Meta');
    await page.keyboard.press('z'); // Cmd+Z — uses a shortcut instead of revealing them
    await page.keyboard.up('Meta');
    await page.waitForTimeout(2200);
    await expect(page.locator('.shortcut-badge')).toHaveCount(0);
  });
});
