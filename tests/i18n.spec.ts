import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

test.describe('UI internationalization', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'modern-only feature');

  test('?ui= translates the interface', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'lazy-loaded locales are a rewrite-only feature');
    await page.goto('/index.html#?ui=de');
    await waitForApp(page);
    await page.locator('#tool-settings').click();
    await expect(page.locator('.more-row span').first()).toHaveText('Benutzeroberfläche');
  });

  test('language picker shows "English name - Native name"', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'lazy-loaded locales are a rewrite-only feature');
    await page.goto('/index.html');
    await waitForApp(page);
    await page.locator('#tool-settings').click();
    const labels = await page.locator('.more-row select').first().locator('option').allTextContents();
    expect(labels).toContain('German - Deutsch');
    expect(labels).toContain('English'); // native == english, no dash
    expect(labels).toContain('American Sign Language'); // FSW: english name only
  });

  test('chosen language is saved and restored across reloads', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'lazy-loaded locales are a rewrite-only feature');
    await page.goto('/index.html');
    await waitForApp(page);
    await page.locator('#tool-settings').click();
    await page.locator('.more-row select').first().selectOption('es');
    await expect(page.locator('.more-row span').first()).toHaveText('Interfaz');

    await page.reload();
    await waitForApp(page);
    await page.locator('#tool-settings').click();
    await expect(page.locator('.more-row select').first()).toHaveValue('es');
  });
});
