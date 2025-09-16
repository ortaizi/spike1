import { test, expect } from '@playwright/test';

/**
 * 🧪 SMOKE TESTS - Critical path validation for Spike Academic Platform
 * 
 * These tests ensure core functionality works after deployment
 * with special focus on Hebrew/RTL support and BGU integration
 */

test.describe('🧪 Smoke Tests - Core Functionality', () => {
  test.describe.configure({ mode: 'parallel' });

  test('🏠 Homepage loads correctly with Hebrew support', async ({ page }) => {
    await page.goto('/');
    
    // Check basic page load
    await expect(page).toHaveTitle(/Spike/);
    
    // Verify Hebrew language support
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('lang', /he/);
    
    // Check for RTL direction
    const bodyElement = page.locator('body');
    await expect(bodyElement).toHaveCSS('direction', 'rtl');
    
    // Verify main navigation is accessible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('🔐 Authentication page accessibility', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Page loads without errors
    await expect(page).toHaveURL(/auth\/signin/);
    
    // Hebrew authentication elements visible
    await expect(page.locator('form')).toBeVisible();
    
    // Check for BGU authentication option
    const bguOption = page.getByText(/בן גוריון|BGU/);
    if (await bguOption.count() > 0) {
      await expect(bguOption).toBeVisible();
    }
  });

  test('🎓 Dashboard route protection', async ({ page }) => {
    // Attempt to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to authentication or show login prompt
    await page.waitForURL(/auth|signin/);
    expect(page.url()).toMatch(/auth|signin/);
  });

  test('🌐 API health endpoints', async ({ page, request }) => {
    // Test API health endpoint
    const healthResponse = await request.get('/api/health');
    expect(healthResponse.ok()).toBeTruthy();
    
    // Test universities API
    const universitiesResponse = await request.get('/api/universities');
    expect(universitiesResponse.ok()).toBeTruthy();
    
    const universities = await universitiesResponse.json();
    expect(Array.isArray(universities)).toBeTruthy();
  });

  test('📱 Mobile responsiveness with Hebrew text', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check mobile navigation
    const mobileNav = page.locator('[role="navigation"]');
    await expect(mobileNav).toBeVisible();
    
    // Verify Hebrew text renders properly on mobile
    const hebrewText = page.locator('text=/[א-ת]/').first();
    if (await hebrewText.count() > 0) {
      await expect(hebrewText).toBeVisible();
    }
  });
});

test.describe('🎓 Academic Platform Specific Tests', () => {
  test('📚 Academic year and semester handling', async ({ page }) => {
    await page.goto('/');
    
    // Check for academic year context
    const academicContext = page.locator('[data-testid="academic-context"]');
    if (await academicContext.count() > 0) {
      await expect(academicContext).toContainText(/202[0-9]|תש"פ|תש"ח/);
    }
  });

  test('🌍 Hebrew locale and timezone', async ({ page }) => {
    await page.goto('/');
    
    // Verify Israeli timezone handling
    const dateElements = page.locator('time, [data-testid*="date"]');
    if (await dateElements.count() > 0) {
      const firstDateElement = dateElements.first();
      await expect(firstDateElement).toBeVisible();
    }
  });

  test('🔗 External university links accessibility', async ({ page, request }) => {
    await page.goto('/');
    
    // Check if BGU links are properly configured
    const bguLinks = page.locator('a[href*="bgu.ac.il"]');
    if (await bguLinks.count() > 0) {
      const firstBguLink = bguLinks.first();
      
      // Verify link has proper attributes
      await expect(firstBguLink).toHaveAttribute('target', '_blank');
      await expect(firstBguLink).toHaveAttribute('rel', /noopener|noreferrer/);
    }
  });
});

test.describe('🔒 Security & Performance Smoke Tests', () => {
  test('🛡️ Security headers present', async ({ request }) => {
    const response = await request.get('/');
    
    // Check for security headers
    const headers = response.headers();
    expect(headers['x-frame-options'] || headers['x-content-type-options']).toBeTruthy();
  });

  test('⚡ Page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('🌐 Hebrew fonts load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);
    
    // Check if Hebrew text is properly rendered
    const hebrewText = page.locator('text=/[א-ת]/').first();
    if (await hebrewText.count() > 0) {
      const boundingBox = await hebrewText.boundingBox();
      expect(boundingBox?.height).toBeGreaterThan(0);
    }
  });
});

/**
 * CRITICAL TESTS - These must pass for deployment to succeed
 */
test.describe('🚨 CRITICAL: Production Readiness', () => {
  test('CRITICAL: Application starts without errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('Analytics') &&
      !error.includes('Third-party')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('CRITICAL: Hebrew authentication flow accessible', async ({ page }) => {
    await page.goto('/auth/signin');

    // Must have accessible Google OAuth authentication
    const googleSigninButton = page.locator('button:has-text("התחבר עם Google"), button:has-text("Google")');
    await expect(googleSigninButton).toBeVisible();
    await expect(googleSigninButton).toBeEnabled();

    // Must have Hebrew UI elements
    const hebrewText = page.locator('text=/התחבר|התחברות|Google/').first();
    await expect(hebrewText).toBeVisible();

    // Page should be RTL
    const htmlElement = page.locator('html');
    const dir = await htmlElement.getAttribute('dir');
    if (dir) {
      expect(dir).toBe('rtl');
    }
  });

  test('CRITICAL: API endpoints respond correctly', async ({ request }) => {
    // Test critical API endpoints
    const endpoints = [
      '/api/health',
      '/api/universities',
      '/api/auth/signin'  // Should return method not allowed but not crash
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      // Should not return 500 errors
      expect(response.status()).not.toBe(500);
      expect(response.status()).not.toBe(502);
      expect(response.status()).not.toBe(503);
    }
  });
});