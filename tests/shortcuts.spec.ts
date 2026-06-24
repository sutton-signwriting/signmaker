import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

test.describe('shortcut sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
  });

  test('holding Cmd reveals the shortcut list, released on key up', async ({ page }) => {
    await expect(page.locator('.shortcut-sheet')).toHaveCount(0);
    await page.keyboard.down('Meta');
    // Appears only after the ~1s hold.
    await expect(page.locator('.shortcut-sheet')).toBeVisible({ timeout: 3000 });
    // Lists many shortcuts, each with a label and its key(s).
    expect(await page.locator('.shortcut-row').count()).toBeGreaterThan(10);
    await expect(page.locator('.shortcut-row', { hasText: 'Undo' }).locator('kbd')).toHaveText('⌘Z');
    await expect(page.locator('.shortcut-row', { hasText: 'Rotate +' }).locator('kbd')).toHaveText('/');

    await page.keyboard.up('Meta');
    await expect(page.locator('.shortcut-sheet')).toHaveCount(0);
  });

  test('pressing another key cancels the reveal before it shows', async ({ page }) => {
    await page.keyboard.down('Meta');
    await page.keyboard.press('z'); // Cmd+Z — uses a shortcut instead of revealing them
    await page.keyboard.up('Meta');
    await page.waitForTimeout(2200);
    await expect(page.locator('.shortcut-sheet')).toHaveCount(0);
  });
});
