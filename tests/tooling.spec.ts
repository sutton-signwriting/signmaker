import { test, expect } from '@playwright/test';
import { waitForApp } from './support';

test.describe('language tooling', () => {
  test.beforeEach(async ({ page }) => {
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

  test('translate renders a sign and adds it to the canvas', async ({ page }) => {
    await page.route('**/recaptcha/enterprise.js*', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'window.grecaptcha = { enterprise: { ready: (cb) => cb(), execute: () => Promise.resolve("test-token") } };',
      }),
    );
    let recaptchaToken = '';
    await page.route('https://sw-translation.nagish.io/**', (route) => {
      if (route.request().method() !== 'POST') return route.fulfill({ json: { status: 'ok' } });
      recaptchaToken = route.request().headers()['x-recaptcha-token'];
      return route.fulfill({ json: { input: ['hello'], output: ['M518x529S14c20481x471S27106503x489'] } });
    });

    await page.locator('[data-tool=language]').click();
    await page.locator('.tool-field select').nth(1).selectOption('ase');
    await page.locator('[data-tool=language]').click();

    await page.locator('[data-tool=translate]').click();
    await page.locator('.tool-input').fill('hello');
    await page.locator('.tool-use').click();

    expect(recaptchaToken).toBe('test-token');
    await expect(page.locator('#signbox .signbox-symbol')).toHaveCount(2);
  });
});
