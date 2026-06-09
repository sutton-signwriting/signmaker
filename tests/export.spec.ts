import { test, expect } from '@playwright/test';
import { waitForApp, SIGNS } from './support';

test.describe('PNG/SVG export', () => {
  test('downloads a real, sized PNG (not a 1x1 blank)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'modern export dialog is a rewrite-only feature');
    await page.goto(`/index.html#?fsw=${SIGNS.M}`);
    await waitForApp(page);

    await page.locator('#tool-export').click();
    const download = page.waitForEvent('download');
    await page.locator('.export-download').click();
    const stream = await (await download).createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const buf = Buffer.concat(chunks);

    expect(buf.subarray(1, 4).toString()).toBe('PNG'); // PNG signature
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBeGreaterThan(1); // a blank 1x1 canvas was the bug
    expect(height).toBeGreaterThan(1);
  });

  test('copies the PNG to the clipboard from the preview', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name === 'legacy', 'modern export dialog is a rewrite-only feature');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/index.html#?fsw=${SIGNS.M}`);
    await waitForApp(page);

    await page.locator('#tool-export').click();
    await page.locator('.export-copy').click();
    await expect(page.locator('.export-copy')).toHaveAttribute('data-tip', 'Copied'); // set after the write resolves
    const types = await page.evaluate(async () =>
      (await navigator.clipboard.read()).flatMap((item) => item.types),
    );
    expect(types).toContain('image/png');
  });
});
