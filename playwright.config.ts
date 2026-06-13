import { defineConfig, devices } from '@playwright/test';

const MODERN_PORT = 4984;

/**
 * E2E suite for the built modern app. The original legacy parity suite was used during
 * the v2 migration and removed when the legacy implementation left the tree.
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
      name: 'modern',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${MODERN_PORT}` },
    },
  ],
  webServer: {
    command: `npm run build:package && npx vite preview --port ${MODERN_PORT} --strictPort`,
    url: `http://localhost:${MODERN_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
