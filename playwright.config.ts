import { defineConfig, devices } from '@playwright/test';

/**
 * 🎓 SPIKE ACADEMIC PLATFORM - PLAYWRIGHT E2E CONFIGURATION
 *
 * Enterprise-grade E2E testing setup with Hebrew/RTL support
 * and academic platform specific scenarios
 */

export default defineConfig({
  // ================================================================================================
  // 📁 TEST ORGANIZATION
  // ================================================================================================
  testDir: './tests/e2e',

  // Run tests in files that match this pattern
  testMatch: '**/*.{test,spec}.{js,ts}',

  // ================================================================================================
  // ⚡ PERFORMANCE & PARALLELIZATION
  // ================================================================================================

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // ================================================================================================
  // 📊 REPORTING
  // ================================================================================================

  reporter: [
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: process.env.CI ? 'never' : 'on-failure',
      },
    ],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line'],
  ],

  // ================================================================================================
  // 🌍 GLOBAL SETTINGS (Hebrew/RTL Focus)
  // ================================================================================================

  use: {
    // Base URL for all tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // Hebrew locale and RTL support
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',

    // Browser context options
    ignoreHTTPSErrors: true,

    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'on-first-retry',

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Trace collection
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',

    // ================================================================================================
    // 🎓 ACADEMIC PLATFORM SPECIFIC SETTINGS
    // ================================================================================================

    // Viewport (academic dashboard focus)
    viewport: { width: 1280, height: 720 },

    // User agent with Hebrew support
    userAgent: 'Spike-E2E-Tests Mozilla/5.0 (compatible; Hebrew/RTL)',

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
      'X-Test-Environment': 'e2e',
    },

    // Permissions for academic features
    permissions: ['clipboard-read', 'clipboard-write'],

    // Academic platform specific storage state
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            {
              name: 'spike-locale',
              value: 'he',
            },
            {
              name: 'spike-academic-year',
              value: '2024',
            },
            {
              name: 'spike-semester',
              value: 'א',
            },
          ],
        },
      ],
    },
  },

  // ================================================================================================
  // 🌐 MULTI-BROWSER TESTING
  // ================================================================================================

  projects: [
    // ================================================================================================
    // 🖥️ DESKTOP BROWSERS
    // ================================================================================================

    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    // ================================================================================================
    // 📱 MOBILE DEVICES (Hebrew/RTL Focus)
    // ================================================================================================

    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
      },
    },

    // ================================================================================================
    // 🎓 ACADEMIC PLATFORM SPECIFIC BROWSERS
    // ================================================================================================

    {
      name: 'Hebrew RTL Desktop',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
        viewport: { width: 1440, height: 900 },
        extraHTTPHeaders: {
          'Accept-Language': 'he-IL,he;q=1.0',
        },
      },
    },

    {
      name: 'BGU Network Simulation',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
        // Simulate slower university network
        launchOptions: {
          args: ['--disable-web-security', '--simulate-slow-connection'],
        },
      },
    },

    // ================================================================================================
    // 📊 ACCESSIBILITY TESTING
    // ================================================================================================

    {
      name: 'Accessibility Test',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'he-IL',
        timezoneId: 'Asia/Jerusalem',
        // High contrast mode for accessibility
        colorScheme: 'light',
        reducedMotion: 'reduce',
      },
    },
  ],

  // ================================================================================================
  // 🚀 DEVELOPMENT SERVER
  // ================================================================================================

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for slow academic system setup
    env: {
      NODE_ENV: 'test',
      NEXTAUTH_SECRET: process.env.TEST_NEXTAUTH_SECRET || 'fallback-test-secret',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
  },

  // ================================================================================================
  // ⚙️ ADVANCED CONFIGURATION
  // ================================================================================================

  // Global setup and teardown
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Test timeout
  timeout: 30 * 1000, // 30 seconds

  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000, // 10 seconds for Hebrew text loading

    // Screenshot comparison
    toMatchScreenshot: {
      threshold: 0.3,
      mode: 'strict',
    },
  },

  // ================================================================================================
  // 🎓 ACADEMIC PLATFORM TEST CATEGORIES
  // ================================================================================================

  // Test patterns for different academic features
  testIgnore: [
    // Skip tests that require external university systems in CI
    process.env.CI ? '**/moodle-integration.spec.ts' : '',
    process.env.CI ? '**/bgu-sso.spec.ts' : '',
  ].filter(Boolean),

  // ================================================================================================
  // 🔧 OUTPUT CONFIGURATION
  // ================================================================================================

  outputDir: 'test-results',

  // Artifacts
  use: {
    ...devices['Desktop Chrome'],
    // Trace files for debugging
    trace: {
      mode: 'retain-on-failure',
      screenshots: true,
      snapshots: true,
      sources: true,
    },

    // Video recording with Hebrew UI
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },
  },
});
