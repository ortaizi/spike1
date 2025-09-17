/**
 * 🔒 HEBREW AUTHENTICATION FLOW E2E TESTS
 *
 * End-to-end testing for the complete Hebrew authentication workflow,
 * including Google OAuth, university selection, and Hebrew UI validation.
 *
 * Part of Phase 4: E2E Testing Implementation
 */

import { expect, test } from '@playwright/test';

test.describe('🔒 Hebrew Authentication Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the main page
    await page.goto('/');
  });

  test.describe('👤 University Selection & Authentication', () => {
    test('should display Hebrew university selection interface', async ({ page }) => {
      // Check main page loads with Hebrew content
      await expect(page.locator('h1')).toContainText('ספייק');

      // Navigate to authentication
      await page.click('[data-testid="get-started-btn"]');

      // Should show university selection
      await expect(page.locator('h2')).toContainText('בחר את האוניברסיטה שלך');

      // Check BGU option is visible with Hebrew name
      const bguOption = page.locator('[data-testid="university-bgu"]');
      await expect(bguOption).toBeVisible();
      await expect(bguOption).toContainText('אוניברסיטת בן-גוריון בנגב');

      // Check other universities shown as "coming soon"
      const technionOption = page.locator('[data-testid="university-technion"]');
      await expect(technionOption).toContainText('הטכניון');
      await expect(technionOption).toContainText('בקרוב');
    });

    test('should handle BGU selection and proceed to Google auth', async ({ page }) => {
      // Navigate to university selection
      await page.click('[data-testid="get-started-btn"]');

      // Select BGU
      await page.click('[data-testid="university-bgu"]');

      // Should show authentication options
      await expect(page.locator('h2')).toContainText('התחבר לחשבון BGU שלך');

      // Check Google auth button in Hebrew
      const googleBtn = page.locator('[data-testid="google-auth-btn"]');
      await expect(googleBtn).toBeVisible();
      await expect(googleBtn).toContainText('התחבר עם Google');

      // Check Hebrew instructions
      await expect(page.locator('[data-testid="auth-instructions"]')).toContainText(
        'השתמש בחשבון Google המקושר לאוניברסיטה'
      );
    });

    test('should display proper Hebrew error messages for invalid university selection', async ({ page }) => {
      // Navigate to university selection
      await page.click('[data-testid="get-started-btn"]');

      // Try to select a "coming soon" university
      await page.click('[data-testid="university-technion"]');

      // Should show Hebrew error message
      const errorMsg = page.locator('[data-testid="error-message"]');
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toContainText('הטכניון אינו נתמך כעת');
      await expect(errorMsg).toContainText('בקרוב');

      // Error should contain Hebrew characters
      const errorText = await errorMsg.textContent();
      expect(errorText).toMatch(/[\u0590-\u05FF]/);
    });
  });

  test.describe('🔑 Authentication Process', () => {
    test('should handle Google OAuth flow with Hebrew UI', async ({ page }) => {
      // Navigate through to Google auth
      await page.click('[data-testid="get-started-btn"]');
      await page.click('[data-testid="university-bgu"]');

      // Mock Google OAuth response (since we can't do real OAuth in E2E)
      await page.route('**/api/auth/signin/google', async (route) => {
        await route.fulfill({
          status: 302,
          headers: { Location: '/auth/callback' },
        });
      });

      // Click Google auth button
      await page.click('[data-testid="google-auth-btn"]');

      // Should show loading state in Hebrew
      await expect(page.locator('[data-testid="loading-message"]')).toContainText('מתחבר...');
    });

    test('should display BGU credentials form after Google auth', async ({ page }) => {
      // Mock successful Google auth and navigate to credentials form
      await page.goto('/auth/credentials');

      // Check Hebrew form title
      await expect(page.locator('h2')).toContainText('פרטי כניסה למודל BGU');

      // Check form fields have Hebrew labels
      const usernameField = page.locator('[data-testid="username-field"]');
      const passwordField = page.locator('[data-testid="password-field"]');

      await expect(page.locator('label[for="username"]')).toContainText('שם משתמש');
      await expect(page.locator('label[for="password"]')).toContainText('סיסמה');

      // Check submit button in Hebrew
      const submitBtn = page.locator('[data-testid="submit-credentials"]');
      await expect(submitBtn).toContainText('שמור פרטים');

      // Check Hebrew help text
      await expect(page.locator('[data-testid="help-text"]')).toContainText('השתמש באותם פרטים שבהם אתה נכנס למודל');
    });

    test('should validate BGU credentials with Hebrew error messages', async ({ page }) => {
      await page.goto('/auth/credentials');

      // Try to submit empty form
      await page.click('[data-testid="submit-credentials"]');

      // Should show Hebrew validation errors
      const usernameError = page.locator('[data-testid="username-error"]');
      const passwordError = page.locator('[data-testid="password-error"]');

      await expect(usernameError).toContainText('שדה חובה');
      await expect(passwordError).toContainText('שדה חובה');

      // Try invalid credentials
      await page.fill('[data-testid="username-field"]', 'invalid');
      await page.fill('[data-testid="password-field"]', 'wrong');

      // Mock API response for invalid credentials
      await page.route('**/api/auth/credentials/validate', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'פרטי כניסה שגויים',
            code: 'INVALID_CREDENTIALS',
          }),
        });
      });

      await page.click('[data-testid="submit-credentials"]');

      // Should show Hebrew error message
      const errorMsg = page.locator('[data-testid="credentials-error"]');
      await expect(errorMsg).toContainText('פרטי כניסה שגויים');
    });
  });

  test.describe('✅ Successful Authentication Flow', () => {
    test('should complete full authentication flow and redirect to dashboard', async ({ page }) => {
      // Mock successful credential validation
      await page.route('**/api/auth/credentials/validate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'פרטים נשמרו בהצלחה',
            redirectTo: '/dashboard',
          }),
        });
      });

      await page.goto('/auth/credentials');

      // Fill valid credentials
      await page.fill('[data-testid="username-field"]', 'testuser');
      await page.fill('[data-testid="password-field"]', 'testpass');
      await page.click('[data-testid="submit-credentials"]');

      // Should show success message in Hebrew
      const successMsg = page.locator('[data-testid="success-message"]');
      await expect(successMsg).toContainText('פרטים נשמרו בהצלחה');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should display Hebrew success messages throughout auth flow', async ({ page }) => {
      await page.goto('/auth/credentials');

      // Mock successful validation
      await page.route('**/api/auth/credentials/validate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '🚀 התחברות אוטומטית הופעלה בהצלחה',
            autoAuth: true,
          }),
        });
      });

      await page.fill('[data-testid="username-field"]', 'testuser');
      await page.fill('[data-testid="password-field"]', 'testpass');
      await page.click('[data-testid="submit-credentials"]');

      // Should show Hebrew success with emoji
      const successMsg = page.locator('[data-testid="success-message"]');
      await expect(successMsg).toContainText('🚀 התחברות אוטומטית הופעלה בהצלחה');

      // Verify Hebrew characters are properly displayed
      const msgText = await successMsg.textContent();
      expect(msgText).toMatch(/[\u0590-\u05FF]/);
    });
  });

  test.describe('🎨 Hebrew UI/UX Validation', () => {
    test('should properly display Hebrew text with RTL layout', async ({ page }) => {
      await page.goto('/auth/credentials');

      // Check RTL text direction
      const mainContent = page.locator('[data-testid="auth-form"]');
      await expect(mainContent).toHaveAttribute('dir', 'rtl');

      // Check Hebrew text alignment
      const title = page.locator('h2');
      const titleStyles = await title.evaluate((el) => getComputedStyle(el));
      expect(titleStyles.textAlign).toBe('right');

      // Check Hebrew text is rendered correctly
      const hebrewTexts = page.locator('text=/[\u0590-\u05FF]/');
      const count = await hebrewTexts.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should handle Hebrew form validation messages correctly', async ({ page }) => {
      await page.goto('/auth/credentials');

      // Submit empty form to trigger validation
      await page.click('[data-testid="submit-credentials"]');

      // Check all error messages are in Hebrew
      const errorMessages = page.locator('[data-testid*="error"]');
      const count = await errorMessages.count();

      for (let i = 0; i < count; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        expect(errorText).toMatch(/[\u0590-\u05FF]/);
      }
    });

    test('should maintain Hebrew content consistency across auth flow', async ({ page }) => {
      // Check university selection page
      await page.click('[data-testid="get-started-btn"]');
      let hebrewContent = page.locator('text=/[\u0590-\u05FF]/');
      let count = await hebrewContent.count();
      expect(count).toBeGreaterThan(3); // Multiple Hebrew elements

      // Check BGU auth page
      await page.click('[data-testid="university-bgu"]');
      hebrewContent = page.locator('text=/[\u0590-\u05FF]/');
      count = await hebrewContent.count();
      expect(count).toBeGreaterThan(2);

      // Check credentials form
      await page.goto('/auth/credentials');
      hebrewContent = page.locator('text=/[\u0590-\u05FF]/');
      count = await hebrewContent.count();
      expect(count).toBeGreaterThan(4); // Form labels, help text, etc.
    });
  });

  test.describe('🧪 CRITICAL: Production Authentication Scenarios', () => {
    test('CRITICAL: should handle complete new user onboarding flow', async ({ page }) => {
      // Simulate complete new user journey
      await page.goto('/');

      // Step 1: Get started
      await page.click('[data-testid="get-started-btn"]');
      await expect(page.locator('h2')).toContainText('בחר את האוניברסיטה שלך');

      // Step 2: Select BGU
      await page.click('[data-testid="university-bgu"]');
      await expect(page.locator('h2')).toContainText('התחבר לחשבון BGU שלך');

      // Step 3: Mock Google OAuth completion
      await page.goto('/auth/credentials');

      // Step 4: Fill credentials
      await page.fill('[data-testid="username-field"]', 'newuser123');
      await page.fill('[data-testid="password-field"]', 'securepass');

      // Mock successful validation
      await page.route('**/api/auth/credentials/validate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '🎓 חשבון נוצר בהצלחה! ברוך הבא לספייק',
            isNewUser: true,
            redirectTo: '/dashboard',
          }),
        });
      });

      await page.click('[data-testid="submit-credentials"]');

      // Should show new user welcome message
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        '🎓 חשבון נוצר בהצלחה! ברוך הבא לספייק'
      );
    });

    test('CRITICAL: should handle returning user auto-authentication', async ({ page }) => {
      // Mock existing user with saved credentials
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              email: 'existing@post.bgu.ac.il',
              university: 'bgu',
              hasValidCredentials: true,
            },
          }),
        });
      });

      await page.goto('/auth/credentials');

      // Should show auto-auth option for returning users
      const autoAuthBtn = page.locator('[data-testid="auto-auth-btn"]');
      await expect(autoAuthBtn).toContainText('השתמש בפרטים השמורים');

      // Mock auto-auth success
      await page.route('**/api/auth/auto-authenticate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '🚀 התחברות אוטומטית הצליחה',
            redirectTo: '/dashboard',
          }),
        });
      });

      await page.click('[data-testid="auto-auth-btn"]');

      // Should show auto-auth success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('🚀 התחברות אוטומטית הצליחה');
    });

    test('CRITICAL: should handle network errors with Hebrew fallback messages', async ({ page }) => {
      await page.goto('/auth/credentials');

      // Mock network error
      await page.route('**/api/auth/credentials/validate', async (route) => {
        await route.abort('failed');
      });

      await page.fill('[data-testid="username-field"]', 'testuser');
      await page.fill('[data-testid="password-field"]', 'testpass');
      await page.click('[data-testid="submit-credentials"]');

      // Should show Hebrew network error message
      const errorMsg = page.locator('[data-testid="error-message"]');
      await expect(errorMsg).toContainText('שגיאת רשת');
      await expect(errorMsg).toContainText('נסה שוב');

      // Error should be in Hebrew
      const errorText = await errorMsg.textContent();
      expect(errorText).toMatch(/[\u0590-\u05FF]/);
    });
  });
});
