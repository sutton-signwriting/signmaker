import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

test.describe('language tooling', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'fingerspelling/mouthing tooling is a modern-only feature');
    await page.goto('/index.html');
    await page.evaluate(() => localStorage.removeItem('signmaker-languages'));
    await page.reload();
    await waitForApp(page);
  });

  test('selecting a sign language enables fingerspelling and mouthing', async ({ page }) => {
    await expect(page.locator('[data-tool=fingerspelling]')).toBeDisabled();
    await expect(page.locator('[data-tool=mouthing]')).toBeDisabled();

    await page.locator('[data-tool=language]').click();
    // second select is "Signed"; choosing ASL auto-selects its spoken language (English).
    await page.locator('.tool-field select').nth(1).selectOption('ase');
    await expect(page.locator('[data-tool=fingerspelling]')).toBeEnabled();
    await expect(page.locator('[data-tool=mouthing]')).toBeEnabled();

    await page.locator('.tool-clear').click();
    await expect(page.locator('[data-tool=fingerspelling]')).toBeDisabled();
  });

  test('selecting a spoken language filters the sign languages', async ({ page }) => {
    await page.locator('[data-tool=language]').click();
    await page.locator('.tool-field select').first().selectOption({ label: 'English' });
    const names = await page.locator('.tool-field select').nth(1).locator('option').allTextContents();
    expect(names).toContain('British Sign Language');
    expect(names).not.toContain('French Sign Language');
  });

  test('translate shows a coming-soon message', async ({ page }) => {
    await page.locator('[data-tool=language]').click();
    await page.locator('.tool-field select').nth(1).selectOption('ase');
    await page.keyboard.press('Escape');
    await page.locator('[data-tool=translate]').click();
    await expect(page.locator('.tool-soon')).toHaveText('Coming soon');
  });
});
