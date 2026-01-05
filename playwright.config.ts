import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const authFile = path.join(__dirname, '.playwright/.auth/user.json');

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers to avoid rate limiting
  // - CI: 1 worker (sequential)
  // - Remote URL testing: 2 workers (reduced concurrency)
  // - Local: undefined (use all available)
  workers: process.env.CI ? 1 : (process.env.PLAYWRIGHT_TEST_BASE_URL ? 2 : undefined),

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
  ],

  // Global timeout
  timeout: 60000,

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',
  },

  // Configure projects
  projects: [
    // Setup project - runs auth before tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Unauthenticated tests (marketing site, public pages)
    {
      name: 'public',
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated tests - Desktop
    {
      name: 'chromium',
      testMatch: /.*(?<!\.public)\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },

    {
      name: 'firefox',
      testMatch: /.*(?<!\.public)\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
    },

    {
      name: 'webkit',
      testMatch: /.*(?<!\.public)\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
    },

    // Mobile tests
    {
      name: 'mobile-chrome',
      testMatch: /.*(?<!\.public)\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        storageState: authFile,
      },
    },

    {
      name: 'mobile-safari',
      testMatch: /.*(?<!\.public)\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['iPhone 12'],
        storageState: authFile,
      },
    },
  ],

  // Run your local dev server before starting the tests (skip if testing remote URL)
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
