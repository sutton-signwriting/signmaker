import { test, expect } from '@playwright/test';
import { waitForApp, fswlive, vm } from './support';

test.describe('shortcut editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
  });

  const openEditor = async (page: import('@playwright/test').Page) => {
    await page.keyboard.down('Meta');
    await expect(page.locator('.shortcut-sheet')).toBeVisible({ timeout: 3000 });
    await page.locator('.shortcut-edit').click();
    await page.keyboard.up('Meta');
    await expect(page.locator('.shortcuts-dialog')).toBeVisible();
  };

  test("the sheet's Edit button opens the remapping dialog", async ({ page }) => {
    await openEditor(page);
    await expect(page.locator('.shortcut-edit-row').filter({ hasText: 'Rotate +' }).locator('.shortcut-key-btn')).toHaveText('/');
  });

  test('Settings opens the same dialog', async ({ page }) => {
    await page.locator('#tool-settings').click();
    await page.locator('.settings-dialog button').filter({ hasText: 'Keyboard shortcuts' }).click();
    await expect(page.locator('.shortcuts-dialog')).toBeVisible();
  });

  test('remapping an action rebinds it, and reset restores the default', async ({ page }) => {
    await vm(page, 'add', { key: 'S10000', x: 500, y: 500 });
    await openEditor(page);

    const row = page.locator('.shortcut-edit-row').filter({ hasText: 'Rotate +' });
    await row.locator('.shortcut-key-btn').click(); // start recording
    await expect(row.locator('.shortcut-key-btn')).toHaveClass(/recording/);
    await page.keyboard.press('x'); // bind Rotate + to "x"
    await expect(row.locator('.shortcut-key-btn')).toHaveText('X');
    await page.locator('.shortcuts-dialog .dialog-close').click();

    // The new key now rotates.
    const before = await fswlive(page);
    await page.keyboard.press('x');
    expect(await fswlive(page)).not.toBe(before);

    // Reset restores '/', and 'x' stops rotating.
    await openEditor(page);
    await row.locator('.shortcut-reset').click();
    await expect(row.locator('.shortcut-key-btn')).toHaveText('/');
    await page.locator('.shortcuts-dialog .dialog-close').click();
    const after = await fswlive(page);
    await page.keyboard.press('x');
    expect(await fswlive(page)).toBe(after); // 'x' no longer bound
  });
});
