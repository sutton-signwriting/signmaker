import type { Page } from '@playwright/test';

export const SYMBOL_PATTERN = /S[1-3][0-9a-f]{2}[0-5][0-9a-f]/;
const SYMBOL_SPATIAL = /S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g;

export const SIGNS = {
  M: 'AS10011S10019S2e704S2e748M525x535S2e748483x510S10011501x466S2e704510x500S10019476x475',
  L: 'AS10011S10019S2e704S2e748L525x535S2e748483x510S10011501x466S2e704510x500S10019476x475',
  R: 'AS1f010S10018S20600R519x524S10018485x494S1f010490x494S20600481x476',
  B: 'AS20350S20358S22f04S22f14S30114B528x565S20350508x530S20358477x530S22f04503x551S22f14471x551S30114482x477',
};

export async function waitForApp(page: Page): Promise<void> {
  await page.waitForSelector('#signbox', { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const w = window as unknown as { signmaker?: { vm?: { fswlive?: unknown } } };
      return !!w.signmaker && !!w.signmaker.vm && typeof w.signmaker.vm.fswlive === 'function';
    },
    { timeout: 10000 },
  );
}

export const fswlive = (page: Page): Promise<string> =>
  page.evaluate(() => (window as unknown as { signmaker: { vm: { fswlive: () => string } } }).signmaker.vm.fswlive());

export const fswnorm = (page: Page): Promise<string> =>
  page.evaluate(() => (window as unknown as { signmaker: { vm: { fswnorm: () => string } } }).signmaker.vm.fswnorm());

export const symbolCount = (fsw: string): number => (fsw.match(SYMBOL_SPATIAL) ?? []).length;

/** Run signmaker.vm.<method>(...args) inside the page — works identically on both apps. */
export function vm(page: Page, method: string, ...args: unknown[]): Promise<unknown> {
  return page.evaluate(
    ([m, a]) => {
      const fn = (window as unknown as { signmaker: { vm: Record<string, (...x: unknown[]) => unknown> } }).signmaker.vm[
        m as string
      ];
      return fn(...(a as unknown[]));
    },
    [method, args] as const,
  );
}
