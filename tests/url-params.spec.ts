import { test, expect } from '@playwright/test';
import { waitForApp, fswnorm, SYMBOL_PATTERN, SIGNS } from './support';

const encoded = encodeURIComponent(SIGNS.M);

test.describe('URL parameters', () => {
  test('fsw param loads a sign', async ({ page }) => {
    await page.goto(`/index.html#?fsw=${encoded}`);
    await waitForApp(page);
    expect(await fswnorm(page)).toMatch(SYMBOL_PATTERN);
  });

  test('skin=inverse sets the inverse body skin', async ({ page }) => {
    await page.goto('/index.html#?skin=inverse');
    await waitForApp(page);
    await expect(page.locator('body')).toHaveClass(/inverse/);
  });

  test('skin=colorful sets the colorful body skin', async ({ page }) => {
    await page.goto('/index.html#?skin=colorful');
    await waitForApp(page);
    await expect(page.locator('body')).toHaveClass(/colorful/);
  });

  test('tab=more opens settings with the FSW input', async ({ page }) => {
    await page.goto('/index.html#?tab=more');
    await waitForApp(page);
    await expect(page.locator('dialog.settings-dialog')).toBeVisible();
    await expect(page.locator('dialog.settings-dialog input#fsw')).toBeVisible();
  });

  test('Settings button opens a dialog with the FSW input', async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);
    await page.locator('#tool-settings').click();
    await expect(page.locator('dialog.settings-dialog')).toBeVisible();
    await expect(page.locator('dialog.settings-dialog input#fsw')).toBeVisible();
  });

  test('tab=png opens export with a PNG preview', async ({ page }) => {
    await page.goto(`/index.html#?tab=png&fsw=${encoded}`);
    await waitForApp(page);
    await expect(page.locator('dialog.export-dialog')).toBeVisible();
    await expect(page.locator('.export-copy')).toBeVisible();
    await expect(page.locator('.export-preview-img svg')).toHaveCount(1);
  });

  test('tab=svg opens export with SVG selected', async ({ page }) => {
    await page.goto(`/index.html#?tab=svg&fsw=${encoded}`);
    await waitForApp(page);
    await expect(page.locator('dialog.export-dialog')).toBeVisible();
    await expect(page.locator('.export-tab-active')).toHaveText(/SVG/);
  });

  test('Export button opens a dialog with PNG/SVG and FSW/SWU options', async ({ page }) => {
    await page.goto(`/index.html#?fsw=${encoded}`);
    await waitForApp(page);
    await page.locator('#tool-export').click();
    await expect(page.locator('dialog.export-dialog')).toBeVisible();
    await expect(page.locator('.export-preview-img svg')).toHaveCount(1);
    await expect(page.locator('.export-formats button')).toHaveCount(4); // PNG, SVG, FSW, SWU
  });

  test('Cmd+S opens the export dialog and is repeatable', async ({ page }) => {
    await page.goto(`/index.html#?fsw=${encoded}`);
    await waitForApp(page);
    await page.keyboard.press('Meta+s');
    await expect(page.locator('dialog.export-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.export-dialog')).toBeHidden();
    await page.keyboard.press('Meta+s');
    await expect(page.locator('dialog.export-dialog')).toBeVisible();
  });

  test('FSW/SWU buttons copy to the clipboard and show a toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/index.html#?fsw=${encoded}`);
    await waitForApp(page);
    await page.locator('#tool-export').click();
    await page.locator('.export-copy-text', { hasText: 'FSW' }).click();
    await expect(page.locator('.export-toast')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(SYMBOL_PATTERN);
  });

  test('grid=0 draws no grid lines', async ({ page }) => {
    await page.goto('/index.html#?grid=0');
    await waitForApp(page);
    await expect(page.locator('#signbox svg line')).toHaveCount(0);
  });

  test('grid=2 draws a fine grid', async ({ page }) => {
    await page.goto('/index.html#?grid=2');
    await waitForApp(page);
    expect(await page.locator('#signbox svg line').count()).toBeGreaterThan(2);
  });
});
