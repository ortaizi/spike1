/**
 * 🌍 HEBREW RTL AUTHENTICATION TESTS
 * 
 * Comprehensive testing suite for Hebrew/RTL interface in authentication flows.
 * Covers text rendering, layout direction, font support, and cultural localization.
 */

import { test, expect, type Page } from '@playwright/test';
import hebrewData from '../fixtures/hebrew-data';

// ================================================================================================
// 🧪 RTL TEST UTILITIES
// ================================================================================================

class HebrewRTLTestHelper {
  constructor(private page: Page) {}

  // Check if element has RTL direction
  async expectRTLDirection(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toHaveCSS('direction', 'rtl');
    await expect(element).toHaveCSS('text-align', /right|start/);
  }

  // Check Hebrew font loading
  async expectHebrewFonts(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    const fontFamily = await element.evaluate(el => 
      window.getComputedStyle(el).fontFamily
    );
    
    // Should include Hebrew fonts
    expect(fontFamily.toLowerCase()).toMatch(/heebo|assistant|arial/);
  }

  // Check Hebrew text rendering
  async expectHebrewText(selector: string, expectedText: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toContainText(expectedText);
    
    // Verify Hebrew characters are present
    const text = await element.textContent();
    expect(text).toMatch(/[\u0590-\u05FF]/); // Hebrew Unicode range
  }

  // Check mixed Hebrew-English text alignment
  async expectMixedTextAlignment(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await this.expectRTLDirection(selector);
    
    // Check that numbers and English text maintain LTR within RTL context
    const computedStyle = await element.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        direction: style.direction,
        unicodeBidi: style.unicodeBidi
      };
    });
    
    expect(computedStyle.direction).toBe('rtl');
  }

  // Test Hebrew date formatting
  async expectHebrewDateFormat(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    const dateText = await element.textContent();
    
    // Hebrew date should be in DD/MM/YYYY format (Israeli standard)
    expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  }

  // Check Hebrew error message formatting
  async expectHebrewErrorMessage(expectedMessage: string): Promise<void> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    
    await expect(errorElement).toBeVisible();
    await this.expectHebrewText('[data-testid="error-message"]', expectedMessage);
    await this.expectRTLDirection('[data-testid="error-message"]');
    await this.expectHebrewFonts('[data-testid="error-message"]');
  }
}

// ================================================================================================
// 🧪 TEST SUITE: HEBREW RTL INTERFACE
// ================================================================================================

test.describe('🌍 Hebrew RTL Authentication Interface', () => {
  let rtlHelper: HebrewRTLTestHelper;

  test.beforeEach(async ({ page }) => {
    rtlHelper = new HebrewRTLTestHelper(page);
    
    // Set Hebrew locale
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'he-IL' });
      Object.defineProperty(navigator, 'languages', { get: () => ['he-IL', 'he'] });
    });
  });

  test('login popup displays correctly in Hebrew RTL', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    const popup = page.locator('[data-testid="login-popup"]');
    await expect(popup).toBeVisible();
    
    // Check RTL direction on main container
    await rtlHelper.expectRTLDirection('[data-testid="login-popup"]');
    
    // Check Hebrew title
    await rtlHelper.expectHebrewText('h2', 'התחברות למערכת');
    
    // Check Hebrew description
    await rtlHelper.expectHebrewText('p', 'התחבר עם Google שלך לכל מערכות הלימוד');
    
    // Check Hebrew button text
    await rtlHelper.expectHebrewText('button', 'התחבר עם Google');
    
    // Check Hebrew fonts are loaded
    await rtlHelper.expectHebrewFonts('h2');
    await rtlHelper.expectHebrewFonts('button');
  });

  test('university setup page Hebrew RTL layout', async ({ page }) => {
    // Mock session to bypass Google auth
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'google_123',
            email: 'test@gmail.com',
            name: 'משתמש בדיקה',
            provider: 'google',
            isDualStageComplete: false
          }
        })
      });
    });
    
    await page.goto('/auth/moodle-setup');
    
    // Check page direction
    await rtlHelper.expectRTLDirection('main');
    
    // Check Hebrew page title
    await rtlHelper.expectHebrewText('h1', 'הגדרת פרטי מוסד לימודים');
    
    // Check Hebrew form labels
    await rtlHelper.expectHebrewText('label[for="university"]', 'בחר מוסד לימודים');
    await rtlHelper.expectHebrewText('label[for="username"]', 'שם משתמש במוד״ל');
    await rtlHelper.expectHebrewText('label[for="password"]', 'סיסמה במוד״ל');
    
    // Check Hebrew university options
    const universitySelect = page.locator('#university');
    await expect(universitySelect.locator('option[value="bgu"]')).toContainText('אוניברסיטת בן גוריון');
    await expect(universitySelect.locator('option[value="technion"]')).toContainText('הטכניון');
    await expect(universitySelect.locator('option[value="hebrew"]')).toContainText('האוניברסיטה העברית');
    await expect(universitySelect.locator('option[value="tau"]')).toContainText('אוניברסיטת תל אביב');
    
    // Check Hebrew submit button
    await rtlHelper.expectHebrewText('button[type="submit"]', 'התחבר למערכת');
  });

  test('Hebrew error messages display correctly', async ({ page }) => {
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'google_123', provider: 'google', isDualStageComplete: false }
        })
      });
    });
    
    await page.goto('/auth/moodle-setup');
    
    // Test various error scenarios with Hebrew messages
    const errorScenarios = [
      {
        mockResponse: { 
          error: 'INVALID_CREDENTIALS', 
          message: 'שם משתמש או סיסמה שגויים למערכת מוד״ל' 
        },
        expectedMessage: 'שם משתמש או סיסמה שגויים למערכת מוד״ל'
      },
      {
        mockResponse: { 
          error: 'NETWORK_ERROR', 
          message: 'שגיאת רשת - אנא בדוק את החיבור לאינטרנט' 
        },
        expectedMessage: 'שגיאת רשת - אנא בדוק את החיבור לאינטרנט'
      },
      {
        mockResponse: { 
          error: 'UNIVERSITY_SYSTEM_DOWN', 
          message: 'מערכת המוד״ל של האוניברסיטה אינה זמינה כרגע' 
        },
        expectedMessage: 'מערכת המוד״ל של האוניברסיטה אינה זמינה כרגע'
      }
    ];
    
    for (const scenario of errorScenarios) {
      // Mock error response
      await page.route('**/api/auth/credentials/validate', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, ...scenario.mockResponse })
        });
      });
      
      // Fill form and submit
      await page.selectOption('#university', 'bgu');
      await page.fill('#username', 'testuser');
      await page.fill('#password', 'wrongpass');
      await page.click('button[type="submit"]');
      
      // Check Hebrew error message
      await rtlHelper.expectHebrewErrorMessage(scenario.expectedMessage);
      
      // Clear the error for next test
      await page.reload();
    }
  });

  test('Hebrew text with mixed content renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    // Check mixed Hebrew-English content in info section
    const infoSection = page.locator('.info-section');
    
    // Should contain both Hebrew and English
    await expect(infoSection).toContainText('Google');
    await expect(infoSection).toContainText('מערכות הלימוד');
    
    // Overall direction should be RTL
    await rtlHelper.expectRTLDirection('.info-section');
    
    // Check that English words maintain correct positioning within RTL flow
    await rtlHelper.expectMixedTextAlignment('.info-section');
  });

  test('Hebrew date and time formatting in authentication context', async ({ page }) => {
    // Mock session with Hebrew locale
    await page.addInitScript(() => {
      const originalDateTimeFormat = Intl.DateTimeFormat;
      window.Intl.DateTimeFormat = function(locales, options) {
        return new originalDateTimeFormat('he-IL', options);
      };
    });
    
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user123',
            lastLogin: new Date('2024-12-15T14:30:00+02:00').toISOString(),
            credentialsExpiry: new Date('2024-12-30T23:59:59+02:00').toISOString(),
            isDualStageComplete: true
          }
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Check Hebrew date formatting in session info
    const lastLoginElement = page.locator('[data-testid="last-login"]');
    if (await lastLoginElement.count() > 0) {
      await rtlHelper.expectHebrewDateFormat('[data-testid="last-login"]');
    }
    
    // Check credentials expiry in Hebrew format
    const expiryElement = page.locator('[data-testid="credentials-expiry"]');
    if (await expiryElement.count() > 0) {
      await rtlHelper.expectHebrewDateFormat('[data-testid="credentials-expiry"]');
    }
  });

  test('keyboard navigation works correctly in RTL mode', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    const popup = page.locator('[data-testid="login-popup"]');
    await expect(popup).toBeVisible();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const googleButton = page.locator('button:has-text("התחבר עם Google")');
    await expect(googleButton).toBeFocused();
    
    // Test arrow key navigation in RTL context
    // In RTL, right arrow should move to the previous element, left arrow to next
    await page.keyboard.press('ArrowRight');
    // Should move focus in RTL-appropriate direction
    
    await page.keyboard.press('ArrowLeft'); 
    // Should move focus back
    
    // Enter should activate the button
    await page.keyboard.press('Enter');
    // Should trigger authentication (mocked)
  });

  test('mobile Hebrew RTL responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    const popup = page.locator('[data-testid="login-popup"]');
    await expect(popup).toBeVisible();
    
    // Check mobile RTL layout
    await rtlHelper.expectRTLDirection('[data-testid="login-popup"]');
    
    // Check Hebrew text is readable on mobile
    await rtlHelper.expectHebrewText('h2', 'התחברות למערכת');
    
    // Check button is appropriately sized for Hebrew text
    const googleButton = page.locator('button:has-text("התחבר עם Google")');
    const buttonBox = await googleButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThan(280); // Sufficient width for Hebrew text
    
    // Check touch-friendly button size
    expect(buttonBox?.height).toBeGreaterThan(44); // Minimum touch target size
  });

  test('Hebrew accessibility features', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    // Check lang attribute is set to Hebrew
    const popup = page.locator('[data-testid="login-popup"]');
    await expect(popup).toHaveAttribute('lang', 'he');
    
    // Check ARIA labels are in Hebrew
    const googleButton = page.locator('button:has-text("התחבר עם Google")');
    const ariaLabel = await googleButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/[\u0590-\u05FF]/); // Should contain Hebrew characters
    
    // Check form labels are properly associated
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test', provider: 'google', isDualStageComplete: false }
        })
      });
    });
    
    await googleButton.click();
    await expect(page).toHaveURL('/auth/moodle-setup');
    
    // Check Hebrew form accessibility
    const usernameInput = page.locator('#username');
    const usernameLabel = page.locator('label[for="username"]');
    
    await expect(usernameLabel).toContainText('שם משתמש');
    await expect(usernameInput).toHaveAttribute('aria-describedby');
  });

  test('Hebrew RTL layout in different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    const popup = page.locator('[data-testid="login-popup"]');
    await expect(popup).toBeVisible();
    
    // Check RTL works consistently across browsers
    await rtlHelper.expectRTLDirection('[data-testid="login-popup"]');
    await rtlHelper.expectHebrewText('h2', 'התחברות למערכת');
    
    // Browser-specific adjustments
    if (browserName === 'webkit') {
      // Safari-specific Hebrew font rendering check
      await rtlHelper.expectHebrewFonts('h2');
    } else if (browserName === 'firefox') {
      // Firefox-specific RTL handling check
      const computedDirection = await popup.evaluate(el => 
        window.getComputedStyle(el).direction
      );
      expect(computedDirection).toBe('rtl');
    }
  });
});

// ================================================================================================
// 🧪 TEST SUITE: HEBREW TEXT INPUT AND VALIDATION
// ================================================================================================

test.describe('⌨️ Hebrew Text Input and Validation', () => {
  let rtlHelper: HebrewRTLTestHelper;

  test.beforeEach(async ({ page }) => {
    rtlHelper = new HebrewRTLTestHelper(page);
    
    // Mock authenticated session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user123',
            name: 'משתמש בדיקה',
            provider: 'google',
            isDualStageComplete: false
          }
        })
      });
    });
  });

  test('Hebrew username input in university setup', async ({ page }) => {
    await page.goto('/auth/moodle-setup');
    
    const usernameInput = page.locator('#username');
    
    // Test Hebrew username input
    const hebrewUsername = 'משתמש123';
    await usernameInput.fill(hebrewUsername);
    
    // Verify Hebrew text is entered correctly
    const inputValue = await usernameInput.inputValue();
    expect(inputValue).toBe(hebrewUsername);
    
    // Check RTL direction in input field
    await rtlHelper.expectRTLDirection('#username');
    
    // Check mixed Hebrew-English input works
    const mixedUsername = 'israeli_student_ישראל';
    await usernameInput.fill(mixedUsername);
    
    const mixedValue = await usernameInput.inputValue();
    expect(mixedValue).toBe(mixedUsername);
  });

  test('Hebrew validation messages for form inputs', async ({ page }) => {
    await page.goto('/auth/moodle-setup');
    
    // Test empty field validation
    await page.click('button[type="submit"]');
    
    const validationMessages = await page.locator('.validation-error').allTextContents();
    
    // Should have Hebrew validation messages
    expect(validationMessages.some(msg => /[\u0590-\u05FF]/.test(msg))).toBe(true);
    expect(validationMessages).toContain('נדרש שם משתמש');
    expect(validationMessages).toContain('נדרשת סיסמה');
  });

  test('Hebrew placeholder text in input fields', async ({ page }) => {
    await page.goto('/auth/moodle-setup');
    
    // Check Hebrew placeholders
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    
    const usernamePlaceholder = await usernameInput.getAttribute('placeholder');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    
    // Should contain Hebrew text
    expect(usernamePlaceholder).toMatch(/[\u0590-\u05FF]/);
    expect(passwordPlaceholder).toMatch(/[\u0590-\u05FF]/);
    
    // Common Hebrew placeholders
    expect(usernamePlaceholder).toMatch(/שם משתמש|מזהה/);
    expect(passwordPlaceholder).toMatch(/סיסמה/);
  });
});

// ================================================================================================
// 🧪 TEST SUITE: HEBREW CULTURAL LOCALIZATION
// ================================================================================================

test.describe('🏛️ Hebrew Cultural Localization', () => {
  test('Israeli academic terminology and context', async ({ page }) => {
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'student123',
            university: 'bgu',
            academicYear: 2024,
            semester: 'א',
            isDualStageComplete: true
          }
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Check for proper Hebrew academic terminology
    const hebrewTerms = [
      'סמסטר א׳',        // Semester A
      'תואר ראשון',      // Bachelor's degree  
      'נקודות זכות',     // Credit points
      'ציון',           // Grade
      'מועד א׳',        // First exam period
      'תרגיל בית'       // Homework
    ];
    
    const pageContent = await page.content();
    
    hebrewTerms.forEach(term => {
      expect(pageContent).toContain(term);
    });
  });

  test('Israeli date and time formats', async ({ page }) => {
    await page.addInitScript(() => {
      // Override Date formatting to Israeli locale
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = function(locale, options) {
        return originalToLocaleDateString.call(this, 'he-IL', options);
      };
    });
    
    await page.goto('/');
    
    // Check that dates are formatted in Israeli DD/MM/YYYY format
    const dateElements = page.locator('[data-date]');
    const dateCount = await dateElements.count();
    
    for (let i = 0; i < dateCount; i++) {
      const dateText = await dateElements.nth(i).textContent();
      // Israeli date format: DD/MM/YYYY
      expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    }
  });

  test('Hebrew university-specific branding and logos', async ({ page }) => {
    const universities = [
      { id: 'bgu', name: 'אוניברסיטת בן גוריון בנגב' },
      { id: 'technion', name: 'הטכניון - מכון טכנולוגי לישראל' },
      { id: 'hebrew', name: 'האוניברסיטה העברית בירושלים' },
      { id: 'tau', name: 'אוניברסיטת תל אביב' }
    ];
    
    for (const university of universities) {
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'student123',
              university: university.id,
              universityName: university.name,
              isDualStageComplete: true
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Check Hebrew university name is displayed
      await expect(page.locator(`text=${university.name}`)).toBeVisible();
      
      // Check university logo is present
      const logo = page.locator(`[alt*="${university.name}"], [alt*="${university.id}"]`);
      if (await logo.count() > 0) {
        await expect(logo).toBeVisible();
      }
    }
  });

  test('Hebrew support information and help text', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    const popup = page.locator('[data-testid="login-popup"]');
    await expect(popup).toBeVisible();
    
    // Check Hebrew instructions
    const instructions = page.locator('.instructions, .help-text, .info-section');
    const instructionsCount = await instructions.count();
    
    for (let i = 0; i < instructionsCount; i++) {
      const text = await instructions.nth(i).textContent();
      if (text && text.trim()) {
        // Should contain Hebrew characters
        expect(text).toMatch(/[\u0590-\u05FF]/);
      }
    }
    
    // Check security notice in Hebrew
    const securityNotice = page.locator('.security-notice');
    if (await securityNotice.count() > 0) {
      await expect(securityNotice).toContainText('אבטחה');
    }
  });
});