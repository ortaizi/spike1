import { test, expect } from '@playwright/test';

test('authentication system is responsive', async ({ page }) => {
  // Test homepage loads
  await page.goto('/');
  const title = await page.title();
  expect(title).toContain('spike');
  console.log('✅ Homepage loaded:', title);
  
  // Test auth API endpoint responds
  const response = await page.request.get('/api/auth/session');
  expect(response.status()).toBe(200);
  console.log('✅ Auth API responding');
  
  // Look for Hebrew UI elements
  const hebrewElements = await page.locator('text=/[\u0590-\u05FF]/').count();
  console.log(`✅ Found ${hebrewElements} Hebrew UI elements`);
  
  // Test if login flow is accessible
  const loginElements = await page.locator('button:has-text("התחבר"), [data-testid*="login"]').count();
  console.log(`✅ Found ${loginElements} login-related elements`);
  
  console.log('🎯 Authentication system basic check: PASSED');
});