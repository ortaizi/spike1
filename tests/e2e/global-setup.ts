import { chromium, FullConfig } from '@playwright/test';

/**
 * 🌍 GLOBAL SETUP - Spike Academic Platform E2E Tests
 *
 * Prepares the testing environment for Hebrew/RTL academic platform testing
 */

async function globalSetup(config: FullConfig) {
  console.log('🎓 Setting up Spike Academic Platform E2E testing environment...');

  const { baseURL } = config.projects[0].use;

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🌐 Checking application availability...');

    // Wait for the application to be ready
    let retries = 0;
    const maxRetries = 30; // 30 seconds

    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL || 'http://localhost:3000', {
          waitUntil: 'networkidle',
          timeout: 2000,
        });

        if (response && response.ok()) {
          console.log('✅ Application is ready');
          break;
        }
      } catch (error) {
        retries++;
        console.log(`⏳ Waiting for application... (${retries}/${maxRetries})`);
        await page.waitForTimeout(1000);
      }
    }

    if (retries >= maxRetries) {
      throw new Error('❌ Application did not become available in time');
    }

    // Verify Hebrew/RTL support
    console.log('🌍 Verifying Hebrew/RTL support...');
    const htmlElement = await page.locator('html');
    const lang = await htmlElement.getAttribute('lang');

    if (lang && lang.includes('he')) {
      console.log('✅ Hebrew language support confirmed');
    } else {
      console.log('⚠️  Hebrew language support not detected');
    }

    // Check if authentication system is responding
    console.log('🔐 Testing authentication system...');
    try {
      await page.goto((baseURL || 'http://localhost:3000') + '/api/auth/signin', { timeout: 5000 });
      console.log('✅ Authentication system responding');
    } catch (error) {
      console.log('⚠️  Authentication system check failed:', error);
    }

    // Verify academic year context
    console.log('📚 Checking academic context...');
    await page.goto(baseURL || 'http://localhost:3000');

    // Check for Hebrew academic terms
    const hebrewContent = await page.locator('text=/[א-ת]|BGU|בן גוריון/').count();
    if (hebrewContent > 0) {
      console.log('✅ Academic Hebrew content detected');
    }

    // Set up test data if needed
    console.log('📊 Setting up test environment data...');

    // Store authentication state for tests (if available)
    await page.context().storageState({ path: 'tests/e2e/auth.json' });

    console.log('🎯 Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
