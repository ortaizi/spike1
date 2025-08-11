/**
 * 🔐 DUAL-STAGE AUTHENTICATION E2E TESTS
 * 
 * Comprehensive testing suite for Spike's dual-stage authentication system:
 * Stage 1: Google OAuth
 * Stage 2: University Credentials (Moodle)
 * 
 * Tests cover Hebrew/RTL interface, security features, and error scenarios.
 */

import { test, expect, type Page } from '@playwright/test';
import hebrewData from '../fixtures/hebrew-data';

// ================================================================================================
// 🧪 TEST HELPERS & UTILITIES
// ================================================================================================

class AuthenticationTestHelper {
  constructor(private page: Page) {}

  // Navigate to login popup
  async openLoginPopup(): Promise<void> {
    await this.page.goto('/');
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForSelector('[data-testid="login-popup"]', { state: 'visible' });
  }

  // Check if Google login button is visible and contains Hebrew text
  async verifyGoogleLoginButton(): Promise<void> {
    const button = this.page.locator('button:has-text("התחבר עם Google")');
    await expect(button).toBeVisible();
    await expect(button).toContainText('התחבר עם Google');
    
    // Check RTL direction
    const direction = await button.getAttribute('dir');
    expect(direction).toBe('rtl');
  }

  // Mock Google OAuth success
  async mockGoogleOAuthSuccess(email: string = 'israel.israeli@gmail.com'): Promise<void> {
    // Mock NextAuth Google OAuth success
    await this.page.route('**/api/auth/signin/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, url: '/auth/moodle-setup' })
      });
    });

    // Mock NextAuth callback
    await this.page.route('**/api/auth/callback/google**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `/auth/moodle-setup?user=${encodeURIComponent(email)}`
        }
      });
    });

    // Mock session with Google user
    await this.page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'google_123456789',
            email: email,
            name: 'ישראל ישראלי',
            image: 'https://example.com/avatar.jpg',
            provider: 'google',
            isDualStageComplete: false
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
  }

  // Mock university authentication success
  async mockUniversityAuthSuccess(): Promise<void> {
    await this.page.route('**/api/auth/credentials/validate', async (route) => {
      const request = route.request();
      const postData = request.postData();
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'התחברות מוצלחת למערכת מוד״ל',
          university: hebrewData.university.bgu
        })
      });
    });

    // Mock dual-stage completion
    await this.page.route('**/api/auth/dual-stage/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sessionToken: 'dual-stage-token-12345',
          redirectTo: '/dashboard'
        })
      });
    });
  }

  // Fill university credentials form
  async fillUniversityCredentials(
    university: string = 'bgu',
    username: string = 'israel123',
    password: string = 'password123'
  ): Promise<void> {
    // Select university
    await this.page.selectOption('[data-testid="university-select"]', university);
    
    // Fill credentials
    await this.page.fill('[data-testid="moodle-username"]', username);
    await this.page.fill('[data-testid="moodle-password"]', password);
    
    // Submit form
    await this.page.click('[data-testid="submit-credentials"]');
  }

  // Check Hebrew error message
  async expectHebrewError(expectedMessage: string): Promise<void> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(expectedMessage);
    
    // Verify RTL direction
    const direction = await errorElement.getAttribute('dir');
    expect(direction).toBe('rtl');
  }

  // Check successful login redirect to dashboard
  async expectSuccessfulLogin(): Promise<void> {
    await expect(this.page).toHaveURL('/dashboard');
    
    // Check for Hebrew welcome message
    const welcomeMessage = this.page.locator('text=ברוכים הבאים');
    await expect(welcomeMessage).toBeVisible();
  }

  // Mock rate limiting
  async mockRateLimitExceeded(): Promise<void> {
    await this.page.route('**/api/auth/credentials/validate', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'TOO_MANY_ATTEMPTS',
          message: 'חרגת ממספר הנסיונות המותר. נסה שוב בעוד 15 דקות.',
          retryAfter: 900 // 15 minutes
        })
      });
    });
  }
}

// ================================================================================================
// 🧪 TEST SUITE: DUAL-STAGE AUTHENTICATION
// ================================================================================================

test.describe('🔐 Dual-Stage Authentication Flow', () => {
  let authHelper: AuthenticationTestHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthenticationTestHelper(page);
  });

  // ================================================================================================
  // ✅ SUCCESSFUL AUTHENTICATION TESTS
  // ================================================================================================

  test('successful dual-stage authentication with Hebrew UI', async ({ page }) => {
    // Stage 1: Google OAuth
    await authHelper.openLoginPopup();
    await authHelper.verifyGoogleLoginButton();
    
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    
    // Should redirect to university setup
    await expect(page).toHaveURL('/auth/moodle-setup');
    
    // Verify Hebrew interface
    const setupTitle = page.locator('h2:has-text("הגדרת פרטי מוסד לימודים")');
    await expect(setupTitle).toBeVisible();
    
    // Stage 2: University credentials
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials('bgu', 'israel123', 'password123');
    
    // Should complete authentication and redirect to dashboard
    await authHelper.expectSuccessfulLogin();
    
    // Verify session contains university data
    const sessionData = await page.evaluate(() => 
      fetch('/api/auth/session').then(res => res.json())
    );
    
    expect(sessionData.user.isDualStageComplete).toBe(true);
    expect(sessionData.user.universityId).toBe('bgu');
    expect(sessionData.user.universityName).toBe('אוניברסיטת בן גוריון בנגב');
  });

  test('BGU university integration with Hebrew interface', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess('student@post.bgu.ac.il');
    await page.click('button:has-text("התחבר עם Google")');
    
    await expect(page).toHaveURL('/auth/moodle-setup');
    
    // Check BGU is pre-selected for BGU email
    const universitySelect = page.locator('[data-testid="university-select"]');
    await expect(universitySelect).toHaveValue('bgu');
    
    // Check Hebrew university name is displayed
    const bguOption = page.locator('option[value="bgu"]');
    await expect(bguOption).toContainText('אוניברסיטת בן גוריון');
    
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials('bgu', 'bgustudent', 'moodlepass');
    await authHelper.expectSuccessfulLogin();
  });

  // ================================================================================================
  // ❌ ERROR SCENARIOS TESTS
  // ================================================================================================

  test('invalid university credentials with Hebrew error message', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    
    await expect(page).toHaveURL('/auth/moodle-setup');
    
    // Mock invalid credentials
    await page.route('**/api/auth/credentials/validate', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'שם משתמש או סיסמה שגויים למערכת מוד״ל'
        })
      });
    });
    
    await authHelper.fillUniversityCredentials('bgu', 'wronguser', 'wrongpass');
    
    // Should show Hebrew error message
    await authHelper.expectHebrewError('שם משתמש או סיסמה שגויים למערכת מוד״ל');
    
    // Should stay on setup page
    await expect(page).toHaveURL('/auth/moodle-setup');
  });

  test('rate limiting with Hebrew warning', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    
    await expect(page).toHaveURL('/auth/moodle-setup');
    
    // Mock rate limiting
    await authHelper.mockRateLimitExceeded();
    await authHelper.fillUniversityCredentials('bgu', 'testuser', 'testpass');
    
    // Should show Hebrew rate limit message
    await authHelper.expectHebrewError('חרגת ממספר הנסיונות המותר. נסה שוב בעוד 15 דקות.');
    
    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="submit-credentials"]');
    await expect(submitButton).toBeDisabled();
  });

  test('network timeout with Hebrew error handling', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    
    // Mock network timeout
    await page.route('**/api/auth/credentials/validate', async (route) => {
      // Delay response to simulate timeout
      await new Promise(resolve => setTimeout(resolve, 31000)); // 31 seconds
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'TIMEOUT',
          message: 'פג תוקף הבקשה למערכת מוד״ל. אנא נסה שוב.'
        })
      });
    });
    
    await authHelper.fillUniversityCredentials();
    
    // Should show Hebrew timeout message
    await authHelper.expectHebrewError('פג תוקף הבקשה למערכת מוד״ל. אנא נסה שוב.');
  });

  // ================================================================================================
  // 🔒 SECURITY TESTS
  // ================================================================================================

  test('credentials are encrypted before storage', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עμε Google")');
    
    // Intercept credentials save request
    let savedCredentials: any = null;
    await page.route('**/api/auth/credentials/save', async (route) => {
      savedCredentials = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials('bgu', 'testuser', 'testpass');
    
    // Verify credentials are encrypted (not plain text)
    expect(savedCredentials).toBeTruthy();
    expect(savedCredentials.encryptedUsername).toBeDefined();
    expect(savedCredentials.encryptedPassword).toBeDefined();
    expect(savedCredentials.authTag).toBeDefined();
    expect(savedCredentials.iv).toBeDefined();
    
    // Verify plain text is not present
    expect(savedCredentials.username).toBeUndefined();
    expect(savedCredentials.password).toBeUndefined();
    expect(JSON.stringify(savedCredentials)).not.toContain('testuser');
    expect(JSON.stringify(savedCredentials)).not.toContain('testpass');
  });

  test('session security and CSRF protection', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    
    // Check for CSRF token in requests
    let hasCSRFToken = false;
    page.on('request', request => {
      const headers = request.headers();
      if (headers['x-csrf-token'] || headers['csrf-token']) {
        hasCSRFToken = true;
      }
    });
    
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials();
    
    await authHelper.expectSuccessfulLogin();
    
    // Verify CSRF protection is active
    expect(hasCSRFToken).toBe(true);
  });

  // ================================================================================================
  // 📱 MOBILE RESPONSIVENESS TESTS
  // ================================================================================================

  test('mobile authentication flow with Hebrew RTL', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.openLoginPopup();
    
    // Verify mobile-responsive design
    const loginPopup = page.locator('[data-testid="login-popup"]');
    await expect(loginPopup).toHaveCSS('direction', 'rtl');
    
    // Check mobile-optimized button
    const googleButton = page.locator('button:has-text("התחבר עם Google")');
    await expect(googleButton).toBeVisible();
    
    const buttonWidth = await googleButton.boundingBox();
    expect(buttonWidth?.width).toBeGreaterThan(280); // Mobile-optimized width
    
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    
    // Mobile university setup should be responsive
    await expect(page).toHaveURL('/auth/moodle-setup');
    
    const setupForm = page.locator('[data-testid="university-setup-form"]');
    await expect(setupForm).toHaveCSS('direction', 'rtl');
    
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials();
    await authHelper.expectSuccessfulLogin();
  });

  // ================================================================================================
  // ♿ ACCESSIBILITY TESTS
  // ================================================================================================

  test('Hebrew accessibility and screen reader support', async ({ page }) => {
    await authHelper.openLoginPopup();
    
    // Check for Hebrew lang attribute
    const loginPopup = page.locator('[data-testid="login-popup"]');
    await expect(loginPopup).toHaveAttribute('lang', 'he');
    
    // Check ARIA labels in Hebrew
    const googleButton = page.locator('button:has-text("התחבר עם Google")');
    await expect(googleButton).toHaveAttribute('aria-label', /התחבר/);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(googleButton).toBeFocused();
    
    await page.keyboard.press('Enter');
    
    // Should work with keyboard activation
    await authHelper.mockGoogleOAuthSuccess();
    await expect(page).toHaveURL('/auth/moodle-setup');
  });

  // ================================================================================================
  // 🔄 SESSION MANAGEMENT TESTS
  // ================================================================================================

  test('session persistence and renewal', async ({ page }) => {
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials();
    await authHelper.expectSuccessfulLogin();
    
    // Refresh page - session should persist
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
    
    // Check session is still active
    const sessionResponse = await page.evaluate(() =>
      fetch('/api/auth/session').then(res => res.json())
    );
    
    expect(sessionResponse.user).toBeTruthy();
    expect(sessionResponse.user.isDualStageComplete).toBe(true);
  });

  test('logout clears all session data', async ({ page }) => {
    // Complete authentication first
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials();
    await authHelper.expectSuccessfulLogin();
    
    // Mock logout endpoint
    await page.route('**/api/auth/signout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
    });
    
    // Perform logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Session should be cleared
    const sessionResponse = await page.evaluate(() =>
      fetch('/api/auth/session').then(res => res.json())
    );
    
    expect(sessionResponse.user).toBeNull();
  });
});

// ================================================================================================
// 🧪 TEST SUITE: UNIVERSITY-SPECIFIC AUTHENTICATION
// ================================================================================================

test.describe('🏫 University-Specific Authentication', () => {
  let authHelper: AuthenticationTestHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthenticationTestHelper(page);
  });

  const universities = [
    { id: 'bgu', name: 'אוניברסיטת בן גוריון', domain: 'bgu.ac.il' },
    { id: 'technion', name: 'הטכניון', domain: 'technion.ac.il' },
    { id: 'hebrew', name: 'האוניברסיטה העברית', domain: 'mail.huji.ac.il' },
    { id: 'tau', name: 'אוניברסיטת תל אביב', domain: 'post.tau.ac.il' }
  ];

  universities.forEach(university => {
    test(`${university.name} authentication flow`, async ({ page }) => {
      await authHelper.openLoginPopup();
      await authHelper.mockGoogleOAuthSuccess(`student@${university.domain}`);
      await page.click('button:has-text("התחבר עם Google")');
      
      await expect(page).toHaveURL('/auth/moodle-setup');
      
      // University should be pre-selected based on email domain
      const universitySelect = page.locator('[data-testid="university-select"]');
      await expect(universitySelect).toHaveValue(university.id);
      
      // Hebrew university name should be displayed
      const selectedOption = page.locator(`option[value="${university.id}"]`);
      await expect(selectedOption).toContainText(university.name);
      
      await authHelper.mockUniversityAuthSuccess();
      await authHelper.fillUniversityCredentials(university.id, 'student', 'password');
      await authHelper.expectSuccessfulLogin();
    });
  });
});

// ================================================================================================
// 🧪 TEST SUITE: PERFORMANCE & LOAD
// ================================================================================================

test.describe('⚡ Performance & Load Testing', () => {
  test('authentication performance under load', async ({ page }) => {
    const startTime = Date.now();
    
    const authHelper = new AuthenticationTestHelper(page);
    await authHelper.openLoginPopup();
    await authHelper.mockGoogleOAuthSuccess();
    await page.click('button:has-text("התחבר עם Google")');
    await authHelper.mockUniversityAuthSuccess();
    await authHelper.fillUniversityCredentials();
    await authHelper.expectSuccessfulLogin();
    
    const totalTime = Date.now() - startTime;
    
    // Authentication should complete within 10 seconds
    expect(totalTime).toBeLessThan(10000);
  });

  test('concurrent authentication attempts handling', async ({ browser }) => {
    // Create multiple browser contexts for concurrent testing
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const authPromises = contexts.map(async (context, index) => {
      const page = await context.newPage();
      const authHelper = new AuthenticationTestHelper(page);
      
      await authHelper.openLoginPopup();
      await authHelper.mockGoogleOAuthSuccess(`user${index}@bgu.ac.il`);
      await page.click('button:has-text("התחבר עم Google")');
      await authHelper.mockUniversityAuthSuccess();
      await authHelper.fillUniversityCredentials('bgu', `user${index}`, 'password');
      await authHelper.expectSuccessfulLogin();
      
      await context.close();
    });
    
    // All concurrent authentications should succeed
    await Promise.all(authPromises);
  });
});