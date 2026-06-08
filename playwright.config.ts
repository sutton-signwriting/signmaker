import { defineConfig, devices } from '@playwright/test';

const LEGACY_PORT = 4983;
const MODERN_PORT = 4984;

/**
 * One e2e suite, two implementations. Both projects run the same specs against their own
 * server — green on both proves the React rewrite preserves the legacy app's behavior.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'legacy',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${LEGACY_PORT}` },
    },
    {
      name: 'modern',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${MODERN_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npx serve legacy -l ${LEGACY_PORT} --no-clipboard`,
      url: `http://localhost:${LEGACY_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: `npm run build && npx vite preview --port ${MODERN_PORT} --strictPort`,
      url: `http://localhost:${MODERN_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
