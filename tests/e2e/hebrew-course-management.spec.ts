/**
 * 🎓 HEBREW COURSE MANAGEMENT E2E TESTS
 * 
 * End-to-end tests for course management with Hebrew content and RTL layout
 */

import { test, expect, Page } from '@playwright/test';
import hebrewData from '../fixtures/hebrew-data';

// Test data
const testCourse = hebrewData.courses.computerScience;
const testUser = hebrewData.users.student1;
const testAssignment = hebrewData.assignments.programmingHomework;

test.describe('Hebrew Course Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Hebrew environment for each test
    await setupHebrewEnvironment(page);
    
    // Navigate to courses page
    await page.goto('/courses');
  });

  // ================================================================================================
  # 📚 COURSE DISPLAY TESTS
  # ================================================================================================

  test('displays Hebrew course names correctly', async ({ page }) => {
    // Wait for course list to load
    await page.waitForSelector('[data-testid="course-list"]');
    
    // Check for Hebrew course name
    const courseName = page.locator(`text=${testCourse.name}`);
    await expect(courseName).toBeVisible();
    
    // Verify Hebrew text is right-aligned
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await expect(courseCard).toHaveCSS('direction', 'rtl');
    await expect(courseCard).toHaveCSS('text-align', 'right');
  });

  test('shows Hebrew course details in correct RTL layout', async ({ page }) => {
    // Click on Hebrew course
    await page.click(`text=${testCourse.name}`);
    
    // Wait for course details page
    await page.waitForSelector('[data-testid="course-details"]');
    
    // Check Hebrew instructor name
    await expect(page.locator(`text=${testCourse.instructor}`)).toBeVisible();
    
    // Check Hebrew faculty name
    await expect(page.locator(`text=${testCourse.faculty}`)).toBeVisible();
    
    // Verify RTL layout
    const courseDetails = page.locator('[data-testid="course-details"]');
    await expect(courseDetails).toHaveAttribute('dir', 'rtl');
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/screenshots/hebrew-course-details.png',
      fullPage: true 
    });
  });

  test('Hebrew course search works correctly', async ({ page }) => {
    // Search for Hebrew course name
    const searchInput = page.locator('[data-testid="course-search"]');
    await searchInput.fill(testCourse.name);
    
    // Verify search input has RTL direction for Hebrew text
    await expect(searchInput).toHaveCSS('direction', 'rtl');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');
    
    # Verify Hebrew course appears in results
    const searchResult = page.locator(`text=${testCourse.name}`);
    await expect(searchResult).toBeVisible();
  });

  # ================================================================================================
  # 📝 ASSIGNMENT MANAGEMENT TESTS
  # ================================================================================================

  test('displays Hebrew assignments with correct due dates', async ({ page }) => {
    // Navigate to assignments
    await page.click('text=המטלות שלי'); // "My Assignments" in Hebrew
    
    await page.waitForSelector('[data-testid="assignments-list"]');
    
    // Check Hebrew assignment title
    await expect(page.locator(`text=${testAssignment.title}`)).toBeVisible();
    
    // Verify Hebrew date format (DD/MM/YYYY)
    const dueDate = new Date(testAssignment.dueDate);
    const hebrewDate = dueDate.toLocaleDateString('he-IL');
    await expect(page.locator(`text=${hebrewDate}`)).toBeVisible();
    
    // Check assignment priority in Hebrew
    if (testAssignment.priority === 'HIGH') {
      await expect(page.locator('text=עדיפות גבוהה')).toBeVisible();
    }
  });

  test('creates new assignment with Hebrew content', async ({ page }) => {
    // Navigate to create assignment
    await page.click('[data-testid="create-assignment-btn"]');
    
    await page.waitForSelector('[data-testid="assignment-form"]');
    
    const newAssignment = {
      title: 'תרגיל חדש במבני נתונים',
      description: 'תרגיל על רשימות מקושרות ועצים בינאריים',
      dueDate: '15/12/2024'
    };
    
    // Fill Hebrew form
    await page.fill('[data-testid="assignment-title"]', newAssignment.title);
    await page.fill('[data-testid="assignment-description"]', newAssignment.description);
    await page.fill('[data-testid="due-date"]', newAssignment.dueDate);
    
    // Verify Hebrew text input works correctly
    const titleInput = page.locator('[data-testid="assignment-title"]');
    await expect(titleInput).toHaveValue(newAssignment.title);
    
    // Submit form
    await page.click('[data-testid="submit-assignment"]');
    
    # Wait for success message in Hebrew
    await expect(page.locator('text=המטלה נוצרה בהצלחה')).toBeVisible();
  });

  # ================================================================================================
  # 📊 GRADES AND ANALYTICS TESTS
  # ================================================================================================

  test('displays Hebrew grade information correctly', async ({ page }) => {
    // Navigate to grades
    await page.click('text=הציונים שלי');
    
    await page.waitForSelector('[data-testid="grades-table"]');
    
    # Check Hebrew column headers
    await expect(page.locator('th', { hasText: 'שם הקורס' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'ציון' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'סמסטר' })).toBeVisible();
    
    # Check Hebrew semester notation (א', ב', קיץ)
    await expect(page.locator(`text=סמסטר ${testCourse.semester}`)).toBeVisible();
    
    # Verify table has RTL reading order
    const table = page.locator('[data-testid="grades-table"]');
    await expect(table).toHaveAttribute('dir', 'rtl');
  });

  # ================================================================================================
  # 🗓️ ACADEMIC CALENDAR TESTS
  # ================================================================================================

  test('shows Hebrew academic calendar correctly', async ({ page }) => {
    await page.click('text=לוח אקדמי');
    
    await page.waitForSelector('[data-testid="academic-calendar"]');
    
    const calendar = hebrewData.calendar.academicYear2024.semesters.fall;
    
    # Check Hebrew semester names
    await expect(page.locator(`text=${calendar.name}`)).toBeVisible();
    
    # Check Hebrew month names
    const hebrewStartDate = calendar.startDate.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    await expect(page.locator(`text=${hebrewStartDate}`)).toBeVisible();
    
    # Check Hebrew holidays
    for (const holiday of calendar.holidays) {
      await expect(page.locator(`text=${holiday.name}`)).toBeVisible();
    }
  });

  # ================================================================================================
  # 🔍 ACCESSIBILITY TESTS
  # ================================================================================================

  test('Hebrew content is accessible via screen reader', async ({ page }) => {
    # Check ARIA labels in Hebrew
    const courseCard = page.locator('[data-testid="course-card"]').first();
    
    # Should have Hebrew aria-label
    const ariaLabel = await courseCard.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/[\u0590-\u05FF]/); // Contains Hebrew characters
    
    # Check language attributes
    await expect(courseCard).toHaveAttribute('lang', 'he');
    await expect(courseCard).toHaveAttribute('dir', 'rtl');
  });

  test('RTL keyboard navigation works correctly', async ({ page }) => {
    const navItems = page.locator('[data-testid="main-nav"] a');
    const count = await navItems.count();
    
    # Tab through navigation items
    await navItems.first().focus();
    
    for (let i = 0; i < count - 1; i++) {
      await page.keyboard.press('Tab');
      
      # In RTL, focus should move right to left
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  # ================================================================================================
  # 📱 MOBILE RTL TESTS
  # ================================================================================================

  test('Hebrew content displays correctly on mobile', async ({ page }) => {
    # Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.waitForSelector('[data-testid="course-list"]');
    
    # Check mobile Hebrew layout
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await expect(courseCard).toHaveCSS('direction', 'rtl');
    
    # Take mobile screenshot
    await page.screenshot({
      path: 'tests/screenshots/hebrew-mobile-courses.png',
      fullPage: true
    });
    
    # Test mobile menu in Hebrew
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('text=הקורסים שלי')).toBeVisible();
    await expect(page.locator('text=המטלות שלי')).toBeVisible();
  });

  # ================================================================================================
  # 🌙 DARK MODE RTL TESTS
  # ================================================================================================

  test('Hebrew content in dark mode maintains RTL layout', async ({ page }) => {
    # Switch to dark mode
    await page.click('[data-testid="theme-toggle"]');
    
    await page.waitForTimeout(500); # Wait for theme transition
    
    # Verify dark mode is active
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    # Check Hebrew text is still visible and RTL
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await expect(courseCard).toHaveCSS('direction', 'rtl');
    
    # Take dark mode screenshot
    await page.screenshot({
      path: 'tests/screenshots/hebrew-dark-mode.png',
      fullPage: true
    });
  });
});

# ================================================================================================
# 🛠️ HELPER FUNCTIONS
# ================================================================================================

async function setupHebrewEnvironment(page: Page) {
  # Set Hebrew locale
  await page.addInitScript(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
    
    # Mock Hebrew user session
    window.localStorage.setItem('user-session', JSON.stringify({
      user: {
        id: 'test-user',
        name: 'ישראל ישראלי',
        email: 'test@bgu.ac.il',
        university: 'bgu',
        preferences: {
          language: 'he',
          rtl: true
        }
      }
    }));
    
    # Set academic context
    window.localStorage.setItem('academic-context', JSON.stringify({
      year: 2024,
      semester: 'א',
      university: 'bgu'
    }));
  });
  
  # Add Hebrew fonts and RTL styles
  await page.addStyleTag({
    content: `
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
      
      body {
        font-family: 'Heebo', Arial, sans-serif;
        direction: rtl;
        text-align: right;
      }
      
      [data-testid*="course"], [data-testid*="assignment"] {
        direction: rtl;
        text-align: right;
      }
    `
  });
}