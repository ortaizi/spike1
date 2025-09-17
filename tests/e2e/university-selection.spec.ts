/**
 * 🏛️ UNIVERSITY SELECTION E2E TESTS
 *
 * End-to-end testing for Hebrew university selection interface,
 * including Israeli university cards, feature displays, and selection workflows.
 *
 * Part of Phase 4: E2E Testing Implementation
 */

import { expect, test } from '@playwright/test';

test.describe('🏛️ University Selection E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to university selection page
    await page.goto('/');
    await page.click('[data-testid="get-started-btn"]');
  });

  test.describe('🎓 Hebrew University Display', () => {
    test('should display all Israeli universities with Hebrew names', async ({ page }) => {
      // Check page title in Hebrew
      await expect(page.locator('h1')).toContainText('בחר את האוניברסיטה שלך');

      // Check BGU card
      const bguCard = page.locator('[data-testid="university-bgu"]');
      await expect(bguCard).toBeVisible();
      await expect(bguCard).toContainText('אוניברסיטת בן-גוריון בנגב');
      await expect(bguCard).toContainText('Ben-Gurion University');

      // Check Technion card
      const technionCard = page.locator('[data-testid="university-technion"]');
      await expect(technionCard).toBeVisible();
      await expect(technionCard).toContainText('הטכניון');
      await expect(technionCard).toContainText('Technion');

      // Check Hebrew University card
      const hujiCard = page.locator('[data-testid="university-hebrew"]');
      await expect(hujiCard).toBeVisible();
      await expect(hujiCard).toContainText('האוניברסיטה העברית');
      await expect(hujiCard).toContainText('Hebrew University');

      // Check Tel Aviv University card
      const tauCard = page.locator('[data-testid="university-tau"]');
      await expect(tauCard).toBeVisible();
      await expect(tauCard).toContainText('אוניברסיטת תל אביב');
      await expect(tauCard).toContainText('Tel Aviv University');
    });

    test('should display university logos and branding correctly', async ({ page }) => {
      // Check BGU logo
      const bguLogo = page.locator('[data-testid="university-bgu"] img');
      await expect(bguLogo).toBeVisible();
      await expect(bguLogo).toHaveAttribute('alt', 'BGU Logo');

      // Check Technion logo
      const technionLogo = page.locator('[data-testid="university-technion"] img');
      await expect(technionLogo).toBeVisible();
      await expect(technionLogo).toHaveAttribute('alt', 'Technion Logo');

      // Check Hebrew University logo
      const hujiLogo = page.locator('[data-testid="university-hebrew"] img');
      await expect(hujiLogo).toBeVisible();
      await expect(hujiLogo).toHaveAttribute('alt', 'HUJI Logo');

      // Check TAU logo
      const tauLogo = page.locator('[data-testid="university-tau"] img');
      await expect(tauLogo).toBeVisible();
      await expect(tauLogo).toHaveAttribute('alt', 'TAU Logo');
    });

    test('should show correct status badges for each university', async ({ page }) => {
      // BGU should show active status
      const bguStatus = page.locator('[data-testid="university-bgu"] [data-testid="status-badge"]');
      await expect(bguStatus).toContainText('פעיל');
      await expect(bguStatus).toHaveClass(/status-active/);

      // Other universities should show "coming soon"
      const technionStatus = page.locator('[data-testid="university-technion"] [data-testid="status-badge"]');
      await expect(technionStatus).toContainText('בקרוב');
      await expect(technionStatus).toHaveClass(/status-coming-soon/);

      const hujiStatus = page.locator('[data-testid="university-hebrew"] [data-testid="status-badge"]');
      await expect(hujiStatus).toContainText('בקרוב');

      const tauStatus = page.locator('[data-testid="university-tau"] [data-testid="status-badge"]');
      await expect(tauStatus).toContainText('בקרוב');
    });
  });

  test.describe('✨ Feature Display and Information', () => {
    test('should display comprehensive feature lists for each university', async ({ page }) => {
      // BGU should show all features as available
      const bguFeatures = page.locator('[data-testid="university-bgu"] [data-testid="features-list"]');
      await expect(bguFeatures).toContainText('גרירת קורסים');
      await expect(bguFeatures).toContainText('מעקב מטלות');
      await expect(bguFeatures).toContainText('מעקב ציונים');
      await expect(bguFeatures).toContainText('סנכרון בזמן אמת');
      await expect(bguFeatures).toContainText('הורדת קבצים');
      await expect(bguFeatures).toContainText('הודעות');

      // Check feature icons are displayed
      const featureIcons = page.locator('[data-testid="university-bgu"] [data-testid="feature-icon"]');
      const iconCount = await featureIcons.count();
      expect(iconCount).toBeGreaterThan(4);
    });

    test('should show different feature availability for coming soon universities', async ({ page }) => {
      // Technion features should be grayed out or marked as unavailable
      const technionFeatures = page.locator('[data-testid="university-technion"] [data-testid="features-list"]');

      // Features should be present but marked as coming soon
      await expect(technionFeatures).toContainText('גרירת קורסים');
      await expect(technionFeatures).toContainText('בפיתוח');

      // Check that feature items have disabled styling
      const disabledFeatures = page.locator(
        '[data-testid="university-technion"] [data-testid="feature-item"].disabled'
      );
      const disabledCount = await disabledFeatures.count();
      expect(disabledCount).toBeGreaterThan(0);
    });

    test('should display active user counts and statistics', async ({ page }) => {
      // BGU should show active user count
      const bguStats = page.locator('[data-testid="university-bgu"] [data-testid="user-stats"]');
      await expect(bguStats).toContainText('משתמשים פעילים');

      // Should show numeric count
      const userCount = page.locator('[data-testid="university-bgu"] [data-testid="user-count"]');
      await expect(userCount).toBeVisible();

      // Count should be a number
      const countText = await userCount.textContent();
      expect(countText).toMatch(/\d+/);

      // Coming soon universities should show 0 or placeholder
      const technionStats = page.locator('[data-testid="university-technion"] [data-testid="user-stats"]');
      await expect(technionStats).toContainText('0');
    });
  });

  test.describe('🖱️ University Selection Interactions', () => {
    test('should allow selection of BGU (active university)', async ({ page }) => {
      // Click BGU card
      await page.click('[data-testid="university-bgu"]');

      // Should navigate to BGU authentication page
      await expect(page).toHaveURL(/\/auth\/bgu/);

      // Should show BGU-specific authentication page
      await expect(page.locator('h1')).toContainText('התחבר לחשבון BGU שלך');
      await expect(page.locator('[data-testid="university-name"]')).toContainText('אוניברסיטת בן-גוריון בנגב');
    });

    test('should prevent selection of coming soon universities', async ({ page }) => {
      // Try to click Technion
      await page.click('[data-testid="university-technion"]');

      // Should show modal or error message
      const errorModal = page.locator('[data-testid="coming-soon-modal"]');
      await expect(errorModal).toBeVisible();
      await expect(errorModal).toContainText('הטכניון אינו זמין עדיין');
      await expect(errorModal).toContainText('אנחנו עובדים על הוספת התמיכה');

      // Should not navigate away from selection page
      await expect(page).toHaveURL(/\/universities/);
    });

    test('should show detailed information on university hover', async ({ page }) => {
      // Hover over BGU card
      await page.hover('[data-testid="university-bgu"]');

      // Should show additional details
      const tooltip = page.locator('[data-testid="university-tooltip"]');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText('post.bgu.ac.il');
      await expect(tooltip).toContainText('moodle.bgu.ac.il');

      // Should show Hebrew description
      await expect(tooltip).toContainText('התמחות');
    });

    test('should handle mobile touch interactions correctly', async ({ page }) => {
      // Simulate mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Cards should be properly sized for mobile
      const bguCard = page.locator('[data-testid="university-bgu"]');
      const cardBox = await bguCard.boundingBox();
      expect(cardBox?.width).toBeLessThan(400);

      // Tap interaction should work
      await page.tap('[data-testid="university-bgu"]');
      await expect(page).toHaveURL(/\/auth\/bgu/);
    });
  });

  test.describe('🎨 Hebrew UI/UX and Layout', () => {
    test('should properly display RTL layout for Hebrew content', async ({ page }) => {
      // Check overall page direction
      const mainContent = page.locator('[data-testid="universities-grid"]');
      await expect(mainContent).toHaveAttribute('dir', 'rtl');

      // Check university card text alignment
      const bguCard = page.locator('[data-testid="university-bgu"]');
      const cardStyles = await bguCard.evaluate((el) => getComputedStyle(el));
      expect(cardStyles.textAlign).toBe('right');

      // Check Hebrew text is properly aligned
      const hebrewTitle = page.locator('[data-testid="university-bgu"] h3');
      const titleStyles = await hebrewTitle.evaluate((el) => getComputedStyle(el));
      expect(titleStyles.direction).toBe('rtl');
    });

    test('should maintain consistent Hebrew typography', async ({ page }) => {
      // Check Hebrew text rendering across all cards
      const hebrewTexts = page.locator('text=/[\u0590-\u05FF]/');
      const count = await hebrewTexts.count();
      expect(count).toBeGreaterThan(10); // Multiple Hebrew elements

      // Check font family is consistent
      const bguTitle = page.locator('[data-testid="university-bgu"] h3');
      const titleFont = await bguTitle.evaluate((el) => getComputedStyle(el).fontFamily);
      expect(titleFont).toMatch(/Inter|Arial|sans-serif/);

      // Hebrew text should not have any encoding issues
      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await hebrewTexts.nth(i).textContent();
        expect(text).not.toContain('�'); // No replacement characters
        expect(text).not.toContain('?'); // No question marks for missing chars
      }
    });

    test('should handle responsive layout correctly with Hebrew content', async ({ page }) => {
      // Test desktop layout
      await page.setViewportSize({ width: 1440, height: 900 });

      const desktopGrid = page.locator('[data-testid="universities-grid"]');
      const desktopColumns = await desktopGrid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
      expect(desktopColumns).toContain('1fr'); // Should have multiple columns

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100); // Allow layout to adjust

      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(100);

      const mobileGrid = page.locator('[data-testid="universities-grid"]');
      const mobileColumns = await mobileGrid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
      // Should be single column on mobile
      expect(mobileColumns.split(' ').length).toBeLessThanOrEqual(2);
    });
  });

  test.describe('🔍 Search and Filtering', () => {
    test('should provide search functionality for universities', async ({ page }) => {
      // Check if search field is present
      const searchField = page.locator('[data-testid="university-search"]');
      if (await searchField.isVisible()) {
        // Test Hebrew search
        await searchField.fill('בן-גוריון');

        // Should filter to show only BGU
        await expect(page.locator('[data-testid="university-bgu"]')).toBeVisible();
        await expect(page.locator('[data-testid="university-technion"]')).not.toBeVisible();

        // Test English search
        await searchField.fill('technion');
        await expect(page.locator('[data-testid="university-technion"]')).toBeVisible();
        await expect(page.locator('[data-testid="university-bgu"]')).not.toBeVisible();

        // Clear search
        await searchField.fill('');
        await expect(page.locator('[data-testid="university-bgu"]')).toBeVisible();
        await expect(page.locator('[data-testid="university-technion"]')).toBeVisible();
      }
    });

    test('should provide filtering by university status', async ({ page }) => {
      // Check if status filter is present
      const statusFilter = page.locator('[data-testid="status-filter"]');
      if (await statusFilter.isVisible()) {
        // Filter to show only active universities
        await statusFilter.selectOption('active');

        await expect(page.locator('[data-testid="university-bgu"]')).toBeVisible();
        await expect(page.locator('[data-testid="university-technion"]')).not.toBeVisible();

        // Filter to show coming soon universities
        await statusFilter.selectOption('coming_soon');

        await expect(page.locator('[data-testid="university-bgu"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="university-technion"]')).toBeVisible();

        // Show all universities
        await statusFilter.selectOption('all');

        await expect(page.locator('[data-testid="university-bgu"]')).toBeVisible();
        await expect(page.locator('[data-testid="university-technion"]')).toBeVisible();
      }
    });
  });

  test.describe('🧪 CRITICAL: Production University Selection Scenarios', () => {
    test('CRITICAL: should handle complete university comparison workflow', async ({ page }) => {
      // User should be able to compare all universities
      const universities = [
        '[data-testid="university-bgu"]',
        '[data-testid="university-technion"]',
        '[data-testid="university-hebrew"]',
        '[data-testid="university-tau"]',
      ];

      for (const university of universities) {
        const card = page.locator(university);
        await expect(card).toBeVisible();

        // Each card should have name in Hebrew and English
        const hebrewName = card.locator('[data-testid="hebrew-name"]');
        const englishName = card.locator('[data-testid="english-name"]');

        await expect(hebrewName).toBeVisible();
        await expect(englishName).toBeVisible();

        // Hebrew name should contain Hebrew characters
        const hebrewText = await hebrewName.textContent();
        expect(hebrewText).toMatch(/[\u0590-\u05FF]/);

        // Features list should be present
        const features = card.locator('[data-testid="features-list"]');
        await expect(features).toBeVisible();
      }
    });

    test('CRITICAL: should provide clear guidance for unsupported universities', async ({ page }) => {
      // Click on a coming soon university
      await page.click('[data-testid="university-technion"]');

      // Should show informative modal with next steps
      const modal = page.locator('[data-testid="coming-soon-modal"]');
      await expect(modal).toBeVisible();

      // Should have Hebrew explanation
      await expect(modal).toContainText('הטכניון אינו זמין עדיין');
      await expect(modal).toContainText('אנחנו עובדים בצורה פעילה');

      // Should provide alternative (BGU)
      await expect(modal).toContainText('בן-גוריון');
      await expect(modal).toContainText('זמין עכשיו');

      // Should have option to go to BGU
      const goToBguBtn = page.locator('[data-testid="goto-bgu-btn"]');
      await expect(goToBguBtn).toContainText('עבור לBGU');

      await goToBguBtn.click();
      await expect(page).toHaveURL(/\/auth\/bgu/);
    });

    test('CRITICAL: should handle university data loading states', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/universities', async (route) => {
        // Delay response to test loading state
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      // Navigate to universities page
      await page.goto('/universities');

      // Should show loading state in Hebrew
      const loadingState = page.locator('[data-testid="loading-universities"]');
      await expect(loadingState).toContainText('טוען אוניברסיטאות...');

      // Should eventually show university cards
      await expect(page.locator('[data-testid="university-bgu"]')).toBeVisible({ timeout: 5000 });
    });

    test('CRITICAL: should handle network errors gracefully with Hebrew messages', async ({ page }) => {
      // Mock network error
      await page.route('**/api/universities', async (route) => {
        await route.abort('failed');
      });

      await page.goto('/universities');

      // Should show Hebrew error message
      const errorState = page.locator('[data-testid="error-loading-universities"]');
      await expect(errorState).toContainText('שגיאה בטעינת האוניברסיטאות');
      await expect(errorState).toContainText('נסה שוב');

      // Should have retry button
      const retryBtn = page.locator('[data-testid="retry-btn"]');
      await expect(retryBtn).toContainText('נסה שוב');
    });

    test('CRITICAL: should maintain accessibility standards for Hebrew content', async ({ page }) => {
      // Check ARIA labels for Hebrew content
      const bguCard = page.locator('[data-testid="university-bgu"]');
      await expect(bguCard).toHaveAttribute('role', 'button');
      await expect(bguCard).toHaveAttribute('aria-label');

      // Check keyboard navigation
      await page.keyboard.press('Tab');
      await expect(bguCard).toBeFocused();

      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/auth\/bgu/);
    });
  });
});
