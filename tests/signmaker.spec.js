import { test, expect } from '@playwright/test';

const SYMBOL_PATTERN = /S[1-3][0-9a-f]{2}[0-5][0-9a-f]/;

const SIGNS = {
  'M signbox': 'AS10011S10019S2e704S2e748M525x535S2e748483x510S10011501x466S2e704510x500S10019476x475',
  'L signbox': 'AS10011S10019S2e704S2e748L525x535S2e748483x510S10011501x466S2e704510x500S10019476x475',
  'R signbox': 'AS1f010S10018S20600R519x524S10018485x494S1f010490x494S20600481x476',
  'B signbox': 'AS20350S20358S22f04S22f14S30114B528x565S20350508x530S20358477x530S22f04503x551S22f14471x551S30114482x477',
};

async function waitForApp(page) {
  await page.waitForSelector('#signbox', { timeout: 30000 });
  await page.waitForFunction(() => {
    return typeof signmaker !== 'undefined'
      && signmaker.vm
      && typeof signmaker.vm.fswlive === 'function';
  }, { timeout: 5000 });
}

test.describe('SignMaker save preserves symbols (issue #1)', () => {
  test.setTimeout(60000);

  for (const [label, fsw] of Object.entries(SIGNS)) {
    test(`loading FSW with ${label} via URL and saving preserves symbols`, async ({ page }) => {
      await page.goto(`/index.html#?fsw=${encodeURIComponent(fsw)}`);
      await waitForApp(page);

      const fswNorm = await page.evaluate(() => signmaker.vm.fswnorm());
      expect(fswNorm, 'fswnorm() should contain symbols after load').toMatch(SYMBOL_PATTERN);

      await page.evaluate(() => signmaker.vm.save());
      const url = page.url();
      const hashFsw = decodeURIComponent(new URL(url).hash.match(/fsw=([^&]*)/)?.[1] || '');
      expect(hashFsw, 'saved FSW in URL should contain symbols').toMatch(SYMBOL_PATTERN);
    });
  }

  test('adding symbols to empty sign and saving preserves them', async ({ page }) => {
    await page.goto('/index.html');
    await waitForApp(page);

    await page.evaluate(() => {
      signmaker.vm.add({ key: 'S10000', x: 500, y: 500 });
      signmaker.vm.add({ key: 'S10010', x: 510, y: 490 });
    });

    const fswLive = await page.evaluate(() => signmaker.vm.fswlive());
    expect(fswLive, 'fswlive() should contain symbols').toMatch(SYMBOL_PATTERN);

    const fswNorm = await page.evaluate(() => signmaker.vm.fswnorm());
    expect(fswNorm, 'fswnorm() should contain symbols').toMatch(SYMBOL_PATTERN);
  });

  test('iframe: loading FSW via postMessage and save message contains symbols', async ({ page }) => {
    await page.goto('/demo.html#?server=local&iframesize=1024x726&view=index.html');
    const iframe = page.frameLocator('#signmaker');
    await iframe.locator('#signbox').waitFor({ timeout: 30000 });

    const testFsw = SIGNS['M signbox'];
    await page.evaluate((fsw) => {
      document.getElementById('signmaker').contentWindow.postMessage({ fsw }, '*');
    }, testFsw);
    await page.waitForTimeout(1000);

    const saveMsg = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('No save message received')), 5000);
        window.addEventListener('message', (event) => {
          if (event.data && event.data.signmaker === 'save') {
            clearTimeout(timeout);
            resolve(event.data);
          }
        });
        document.getElementById('signmaker').contentWindow.eval('signmaker.vm.save()');
      });
    });

    expect(saveMsg.fsw, 'iframe save FSW should contain symbols').toMatch(SYMBOL_PATTERN);
    expect(saveMsg.swu, 'iframe save SWU should contain symbols').toBeTruthy();
    expect(saveMsg.swu.length, 'iframe save SWU should be longer than just signbox').toBeGreaterThan(3);
  });

  test('iframe: loading empty SWU, adding symbols, save message contains symbols', async ({ page }) => {
    await page.goto('/demo.html#?server=local&iframesize=1024x726&view=index.html');
    const iframe = page.frameLocator('#signmaker');
    await iframe.locator('#signbox').waitFor({ timeout: 30000 });

    await page.evaluate(() => {
      document.getElementById('signmaker').contentWindow.postMessage({ signmaker: 'load', swu: '' }, '*');
    });
    await page.waitForTimeout(500);

    await iframe.locator('body').evaluate(() => {
      signmaker.vm.add({ key: 'S10000', x: 500, y: 500 });
      signmaker.vm.add({ key: 'S10010', x: 510, y: 490 });
    });
    await page.waitForTimeout(200);

    const saveMsg = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('No save message received')), 5000);
        window.addEventListener('message', (event) => {
          if (event.data && event.data.signmaker === 'save') {
            clearTimeout(timeout);
            resolve(event.data);
          }
        });
        document.getElementById('signmaker').contentWindow.eval('signmaker.vm.save()');
      });
    });

    expect(saveMsg.fsw, 'iframe save FSW should contain symbols').toMatch(SYMBOL_PATTERN);
  });

  test('iframe: adding symbols WITHOUT prior load, save message contains symbols', async ({ page }) => {
    await page.goto('/demo.html#?server=local&iframesize=1024x726&view=index.html');
    const iframe = page.frameLocator('#signmaker');
    await iframe.locator('#signbox').waitFor({ timeout: 30000 });

    // Do NOT send any load message - reproduce the signbox=undefined bug
    await iframe.locator('body').evaluate(() => {
      signmaker.vm.add({ key: 'S10000', x: 500, y: 500 });
      signmaker.vm.add({ key: 'S10010', x: 510, y: 490 });
    });
    await page.waitForTimeout(200);

    const saveMsg = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('No save message received')), 5000);
        window.addEventListener('message', (event) => {
          if (event.data && event.data.signmaker === 'save') {
            clearTimeout(timeout);
            resolve(event.data);
          }
        });
        document.getElementById('signmaker').contentWindow.eval('signmaker.vm.save()');
      });
    });

    expect(saveMsg.fsw, 'iframe save FSW should contain symbols').toMatch(SYMBOL_PATTERN);
  });
});
