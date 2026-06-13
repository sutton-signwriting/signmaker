import { test, expect } from '@playwright/test';
import { waitForApp, fswnorm, SYMBOL_PATTERN, SIGNS } from './support';

const encoded = encodeURIComponent(SIGNS.M);

test.describe('URL parameters (parity across both implementations)', () => {
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

  test('tab=more shows the FSW input inline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'modern', 'modern moves settings (incl. FSW) into a dialog');
    await page.goto('/index.html#?tab=more');
    await waitForApp(page);
    await expect(page.locator('input#fsw')).toBeVisible();
  });

  test('Settings button opens a dialog with the FSW input', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'settings dialog is a modern-only feature');
    await page.goto('/index.html');
    await waitForApp(page);
    await page.locator('#tool-settings').click();
    await expect(page.locator('dialog.settings-dialog')).toBeVisible();
    await expect(page.locator('dialog.settings-dialog input#fsw')).toBeVisible();
  });

  test('tab=png renders an inline image preview', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'modern', 'modern exports via a dialog instead of an inline preview');
    await page.goto(`/index.html#?tab=png&fsw=${encoded}`);
    await waitForApp(page);
    await expect(page.locator('#signbox .mid img')).toHaveCount(1);
  });

  test('tab=svg renders an inline svg preview', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'modern', 'modern exports via a dialog instead of an inline preview');
    await page.goto(`/index.html#?tab=svg&fsw=${encoded}`);
    await waitForApp(page);
    await expect(page.locator('#signbox .mid svg')).toHaveCount(1);
  });

  test('Export button opens a dialog with PNG/SVG options', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'export dialog is a modern-only feature');
    await page.goto(`/index.html#?fsw=${encoded}`);
    await waitForApp(page);
    await page.locator('#tool-export').click();
    await expect(page.locator('dialog.export-dialog')).toBeVisible();
    await expect(page.locator('.export-preview-img svg')).toHaveCount(1);
    await expect(page.locator('.export-formats button')).toHaveCount(2);
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
