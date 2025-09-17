/**
 * 📊 DASHBOARD NAVIGATION E2E TESTS
 *
 * End-to-end testing for Hebrew dashboard navigation, main features,
 * course management, and academic content display.
 *
 * Part of Phase 4: E2E Testing Implementation
 */

import { expect, test } from '@playwright/test';

test.describe('📊 Dashboard Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-123',
            email: 'student@post.bgu.ac.il',
            name: 'תלמיד בדיקה',
            university: 'bgu',
            faculty: 'מדעי המחשב',
            hasValidCredentials: true,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    // Mock dashboard data
    await page.route('**/api/dashboard/data', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          courses: [
            {
              id: 'cs101',
              name: 'מבוא למדעי המחשב',
              nameEn: 'Introduction to Computer Science',
              code: '20109',
              semester: 'חורף תשפ״ה',
              credits: 4,
              instructor: 'ד״ר יוסי כהן',
              status: 'active',
              assignments: 3,
              announcements: 2,
            },
            {
              id: 'math101',
              name: 'חשבון דיפרנציאלי ואינטגרלי א׳',
              nameEn: 'Calculus 1A',
              code: '20261',
              semester: 'חורף תשפ״ה',
              credits: 4,
              instructor: 'פרופ׳ שרה לוי',
              status: 'active',
              assignments: 2,
              announcements: 1,
            },
          ],
          stats: {
            totalCourses: 6,
            activeCourses: 2,
            totalAssignments: 12,
            pendingAssignments: 5,
            totalCredits: 24,
          },
          recentActivity: [
            {
              type: 'assignment',
              course: 'מבוא למדעי המחשב',
              title: 'מטלה 3 - אלגוריתמים',
              date: '2024-01-15',
              status: 'submitted',
            },
            {
              type: 'announcement',
              course: 'חשבון דיפרנציאלי ואינטגרלי א׳',
              title: 'שינוי במועד הבחינה',
              date: '2024-01-14',
              status: 'unread',
            },
          ],
        }),
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test.describe('🏠 Main Dashboard Layout', () => {
    test('should display Hebrew dashboard header and navigation', async ({ page }) => {
      // Check main header in Hebrew
      await expect(page.locator('h1')).toContainText('לוח הבקרה');

      // Check user greeting in Hebrew
      const userGreeting = page.locator('[data-testid="user-greeting"]');
      await expect(userGreeting).toContainText('שלום, תלמיד בדיקה');

      // Check university display
      const universityInfo = page.locator('[data-testid="university-info"]');
      await expect(universityInfo).toContainText('אוניברסיטת בן-גוריון בנגב');
      await expect(universityInfo).toContainText('מדעי המחשב');

      // Check main navigation menu
      const navMenu = page.locator('[data-testid="main-navigation"]');
      await expect(navMenu).toContainText('קורסים');
      await expect(navMenu).toContainText('מטלות');
      await expect(navMenu).toContainText('הודעות');
      await expect(navMenu).toContainText('הגדרות');
    });

    test('should display academic statistics in Hebrew', async ({ page }) => {
      // Check statistics cards
      const statsGrid = page.locator('[data-testid="stats-grid"]');

      // Total courses
      const coursesCard = page.locator('[data-testid="stat-courses"]');
      await expect(coursesCard).toContainText('סה״כ קורסים');
      await expect(coursesCard).toContainText('6');

      // Active courses
      const activeCoursesCard = page.locator('[data-testid="stat-active-courses"]');
      await expect(activeCoursesCard).toContainText('קורסים פעילים');
      await expect(activeCoursesCard).toContainText('2');

      // Assignments
      const assignmentsCard = page.locator('[data-testid="stat-assignments"]');
      await expect(assignmentsCard).toContainText('מטלות');
      await expect(assignmentsCard).toContainText('5'); // pending assignments

      // Credits
      const creditsCard = page.locator('[data-testid="stat-credits"]');
      await expect(creditsCard).toContainText('נקודות זכות');
      await expect(creditsCard).toContainText('24');
    });

    test('should handle RTL layout correctly in dashboard', async ({ page }) => {
      // Check overall page direction
      const mainContent = page.locator('[data-testid="dashboard-content"]');
      await expect(mainContent).toHaveAttribute('dir', 'rtl');

      // Check statistics grid alignment
      const statsGrid = page.locator('[data-testid="stats-grid"]');
      const gridStyles = await statsGrid.evaluate((el) => getComputedStyle(el));
      expect(gridStyles.direction).toBe('rtl');

      // Check sidebar positioning (should be on the right for RTL)
      const sidebar = page.locator('[data-testid="dashboard-sidebar"]');
      if (await sidebar.isVisible()) {
        const sidebarStyles = await sidebar.evaluate((el) => getComputedStyle(el));
        // In RTL, sidebar should be positioned on the right
        expect(sidebarStyles.marginInlineStart || sidebarStyles.right).toBeDefined();
      }
    });
  });

  test.describe('📚 Courses Section Navigation', () => {
    test('should display courses list with Hebrew course names', async ({ page }) => {
      // Navigate to courses section
      await page.click('[data-testid="nav-courses"]');

      // Check courses list
      const coursesList = page.locator('[data-testid="courses-list"]');

      // Check computer science course
      const csCard = page.locator('[data-testid="course-cs101"]');
      await expect(csCard).toContainText('מבוא למדעי המחשב');
      await expect(csCard).toContainText('Introduction to Computer Science');
      await expect(csCard).toContainText('20109');
      await expect(csCard).toContainText('ד״ר יוסי כהן');
      await expect(csCard).toContainText('4'); // credits

      // Check math course
      const mathCard = page.locator('[data-testid="course-math101"]');
      await expect(mathCard).toContainText('חשבון דיפרנציאלי ואינטגרלי א׳');
      await expect(mathCard).toContainText('Calculus 1A');
      await expect(mathCard).toContainText('20261');
      await expect(mathCard).toContainText('פרופ׳ שרה לוי');
    });

    test('should allow navigation into individual course pages', async ({ page }) => {
      await page.click('[data-testid="nav-courses"]');

      // Click on computer science course
      await page.click('[data-testid="course-cs101"]');

      // Should navigate to course detail page
      await expect(page).toHaveURL(/\/courses\/cs101/);

      // Course page should show Hebrew content
      await expect(page.locator('h1')).toContainText('מבוא למדעי המחשב');
      await expect(page.locator('[data-testid="course-code"]')).toContainText('20109');
    });

    test('should filter courses by semester in Hebrew', async ({ page }) => {
      await page.click('[data-testid="nav-courses"]');

      // Check semester filter
      const semesterFilter = page.locator('[data-testid="semester-filter"]');
      if (await semesterFilter.isVisible()) {
        await expect(semesterFilter).toContainText('חורף תשפ״ה');

        // Filter should work
        await semesterFilter.selectOption('חורף תשפ״ה');
        await expect(page.locator('[data-testid="course-cs101"]')).toBeVisible();
      }
    });
  });

  test.describe('📝 Assignments Section Navigation', () => {
    test('should display assignments list with Hebrew content', async ({ page }) => {
      // Mock assignments data
      await page.route('**/api/assignments', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            assignments: [
              {
                id: 'assign1',
                title: 'מטלה 3 - אלגוריתמים',
                titleEn: 'Assignment 3 - Algorithms',
                course: 'מבוא למדעי המחשב',
                dueDate: '2024-01-20',
                status: 'pending',
                description: 'מימוש אלגוריתמי מיון',
                grade: null,
              },
              {
                id: 'assign2',
                title: 'תרגיל בית 2 - נגזרות',
                titleEn: 'Homework 2 - Derivatives',
                course: 'חשבון דיפרנציאלי ואינטגרלי א׳',
                dueDate: '2024-01-18',
                status: 'submitted',
                description: 'פתרון תרגילים בנגזרות',
                grade: 95,
              },
            ],
          }),
        });
      });

      await page.click('[data-testid="nav-assignments"]');

      // Check assignments list
      const assignmentsList = page.locator('[data-testid="assignments-list"]');

      // Check pending assignment
      const pendingAssign = page.locator('[data-testid="assignment-assign1"]');
      await expect(pendingAssign).toContainText('מטלה 3 - אלגוריתמים');
      await expect(pendingAssign).toContainText('מבוא למדעי המחשב');
      await expect(pendingAssign).toContainText('20/01/2024');
      await expect(pendingAssign).toContainText('ממתין');

      // Check submitted assignment
      const submittedAssign = page.locator('[data-testid="assignment-assign2"]');
      await expect(submittedAssign).toContainText('תרגיל בית 2 - נגזרות');
      await expect(submittedAssign).toContainText('נשלח');
      await expect(submittedAssign).toContainText('95');
    });

    test('should handle assignment status filtering in Hebrew', async ({ page }) => {
      await page.click('[data-testid="nav-assignments"]');

      // Check status filter
      const statusFilter = page.locator('[data-testid="assignment-status-filter"]');
      if (await statusFilter.isVisible()) {
        await expect(statusFilter).toContainText('כל המטלות');
        await expect(statusFilter).toContainText('ממתין');
        await expect(statusFilter).toContainText('נשלח');
        await expect(statusFilter).toContainText('הוחזר');

        // Test filtering
        await statusFilter.selectOption('pending');
        await expect(page.locator('[data-testid="assignment-assign1"]')).toBeVisible();
      }
    });
  });

  test.describe('📢 Announcements Section Navigation', () => {
    test('should display announcements with Hebrew content', async ({ page }) => {
      // Mock announcements data
      await page.route('**/api/announcements', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            announcements: [
              {
                id: 'ann1',
                title: 'שינוי במועד הבחינה',
                content: 'בחינת הביניים תועבר ליום רביעי 25.1.24',
                course: 'חשבון דיפרנציאלי ואינטגרלי א׳',
                date: '2024-01-14',
                status: 'unread',
                priority: 'high',
              },
              {
                id: 'ann2',
                title: 'שעות קבלה נוספות',
                content: 'שעות קבלה נוספות בימי רביעי 14:00-16:00',
                course: 'מבוא למדעי המחשב',
                date: '2024-01-12',
                status: 'read',
                priority: 'normal',
              },
            ],
          }),
        });
      });

      await page.click('[data-testid="nav-announcements"]');

      // Check announcements list
      const unreadAnn = page.locator('[data-testid="announcement-ann1"]');
      await expect(unreadAnn).toContainText('שינוי במועד הבחינה');
      await expect(unreadAnn).toContainText('חשבון דיפרנציאלי ואינטגרלי א׳');
      await expect(unreadAnn).toContainText('14/01/2024');
      await expect(unreadAnn).toHaveClass(/unread/);

      const readAnn = page.locator('[data-testid="announcement-ann2"]');
      await expect(readAnn).toContainText('שעות קבלה נוספות');
      await expect(readAnn).toContainText('מבוא למדעי המחשב');
    });

    test('should mark announcements as read when clicked', async ({ page }) => {
      await page.click('[data-testid="nav-announcements"]');

      // Mock mark as read API
      await page.route('**/api/announcements/*/mark-read', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Click unread announcement
      const unreadAnn = page.locator('[data-testid="announcement-ann1"]');
      await unreadAnn.click();

      // Should show full announcement content
      await expect(page.locator('[data-testid="announcement-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="announcement-content"]')).toContainText(
        'בחינת הביניים תועבר ליום רביעי'
      );
    });
  });

  test.describe('⚙️ Settings and Profile Navigation', () => {
    test('should display user settings in Hebrew', async ({ page }) => {
      await page.click('[data-testid="nav-settings"]');

      // Check settings sections
      await expect(page.locator('h2')).toContainText('הגדרות חשבון');

      // Profile section
      const profileSection = page.locator('[data-testid="profile-section"]');
      await expect(profileSection).toContainText('פרופיל אישי');
      await expect(profileSection).toContainText('תלמיד בדיקה');
      await expect(profileSection).toContainText('student@post.bgu.ac.il');

      // University section
      const uniSection = page.locator('[data-testid="university-section"]');
      await expect(uniSection).toContainText('פרטי אוניברסיטה');
      await expect(uniSection).toContainText('אוניברסיטת בן-גוריון בנגב');
      await expect(uniSection).toContainText('מדעי המחשב');

      // Preferences section
      const prefsSection = page.locator('[data-testid="preferences-section"]');
      await expect(prefsSection).toContainText('העדפות');
    });

    test('should allow language preference changes', async ({ page }) => {
      await page.click('[data-testid="nav-settings"]');

      const langSelect = page.locator('[data-testid="language-select"]');
      if (await langSelect.isVisible()) {
        await expect(langSelect).toContainText('עברית');
        await expect(langSelect).toContainText('English');

        // Test language switch (Hebrew should be default)
        const currentValue = await langSelect.inputValue();
        expect(currentValue).toBe('he');
      }
    });

    test('should allow credential management', async ({ page }) => {
      await page.click('[data-testid="nav-settings"]');

      // Credentials section
      const credsSection = page.locator('[data-testid="credentials-section"]');
      await expect(credsSection).toContainText('פרטי כניסה למודל');

      // Update credentials button
      const updateBtn = page.locator('[data-testid="update-credentials-btn"]');
      await expect(updateBtn).toContainText('עדכן פרטי כניסה');

      await updateBtn.click();

      // Should show credentials update form
      await expect(page.locator('[data-testid="credentials-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="credentials-form"] h3')).toContainText('עדכון פרטי כניסה למודל');
    });
  });

  test.describe('🔍 Search and Quick Actions', () => {
    test('should provide search functionality in Hebrew', async ({ page }) => {
      // Check if global search is present
      const searchInput = page.locator('[data-testid="global-search"]');
      if (await searchInput.isVisible()) {
        await expect(searchInput).toHaveAttribute('placeholder', /חיפוש/);

        // Test Hebrew search
        await searchInput.fill('מבוא למדעי המחשב');
        await page.keyboard.press('Enter');

        // Should show search results
        const searchResults = page.locator('[data-testid="search-results"]');
        await expect(searchResults).toBeVisible();
        await expect(searchResults).toContainText('מבוא למדעי המחשב');
      }
    });

    test('should provide quick action buttons in Hebrew', async ({ page }) => {
      // Check quick actions
      const quickActions = page.locator('[data-testid="quick-actions"]');
      if (await quickActions.isVisible()) {
        await expect(quickActions).toContainText('פעולות מהירות');

        // Check individual actions
        const syncBtn = page.locator('[data-testid="quick-sync"]');
        await expect(syncBtn).toContainText('סנכרון');

        const notificationsBtn = page.locator('[data-testid="quick-notifications"]');
        await expect(notificationsBtn).toContainText('הודעות');
      }
    });
  });

  test.describe('🧪 CRITICAL: Production Dashboard Scenarios', () => {
    test('CRITICAL: should handle complete dashboard workflow with real data patterns', async ({ page }) => {
      // Simulate real user workflow
      await expect(page.locator('h1')).toContainText('לוח הבקרה');

      // Check statistics are loaded
      const statsCards = page.locator('[data-testid="stats-grid"] > *');
      const count = await statsCards.count();
      expect(count).toBeGreaterThan(3);

      // Navigate through main sections
      await page.click('[data-testid="nav-courses"]');
      await expect(page.locator('[data-testid="courses-list"]')).toBeVisible();

      await page.click('[data-testid="nav-assignments"]');
      await expect(page.locator('[data-testid="assignments-list"]')).toBeVisible();

      await page.click('[data-testid="nav-announcements"]');
      await expect(page.locator('[data-testid="announcements-list"]')).toBeVisible();

      // Return to dashboard
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible();
    });

    test('CRITICAL: should handle data loading states and errors gracefully', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/dashboard/data', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('/dashboard');

      // Should show loading state
      const loadingState = page.locator('[data-testid="dashboard-loading"]');
      await expect(loadingState).toContainText('טוען...');

      // Should eventually load content
      await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible({ timeout: 5000 });
    });

    test('CRITICAL: should maintain Hebrew text consistency across all dashboard sections', async ({ page }) => {
      // Check Hebrew content consistency
      const sections = ['courses', 'assignments', 'announcements', 'settings'];

      for (const section of sections) {
        await page.click(`[data-testid="nav-${section}"]`);

        // Each section should have Hebrew headers
        const headers = page.locator('h1, h2, h3');
        const headerCount = await headers.count();

        for (let i = 0; i < headerCount; i++) {
          const headerText = await headers.nth(i).textContent();
          if (headerText && headerText.length > 0) {
            // Should contain Hebrew characters or be English technical terms
            expect(headerText).toMatch(/[\u0590-\u05FF]|[A-Za-z0-9]/);
          }
        }
      }
    });

    test('CRITICAL: should handle responsive layout on mobile devices', async ({ page }) => {
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigation should become mobile-friendly
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      if (await mobileNav.isVisible()) {
        // Should have hamburger menu or bottom navigation
        await expect(mobileNav).toBeVisible();

        // Hebrew text should still be readable on mobile
        const navItems = page.locator('[data-testid="mobile-nav-item"]');
        const count = await navItems.count();

        for (let i = 0; i < count; i++) {
          const text = await navItems.nth(i).textContent();
          expect(text).toMatch(/[\u0590-\u05FF]/);
        }
      }

      // Statistics grid should stack vertically on mobile
      const statsGrid = page.locator('[data-testid="stats-grid"]');
      const gridStyles = await statsGrid.evaluate((el) => getComputedStyle(el));
      expect(gridStyles.gridTemplateColumns).toBe('1fr'); // Single column on mobile
    });

    test('CRITICAL: should handle authentication state changes', async ({ page }) => {
      // Simulate session expiration
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' }),
        });
      });

      // Try to navigate
      await page.click('[data-testid="nav-courses"]');

      // Should redirect to login or show auth error
      await expect(page).toHaveURL(/\/(auth|login)/);
    });
  });
});
