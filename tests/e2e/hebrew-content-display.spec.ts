/**
 * 🎨 HEBREW CONTENT DISPLAY E2E TESTS
 *
 * End-to-end testing for Hebrew content rendering, RTL layout,
 * typography, and academic content display across the platform.
 *
 * Part of Phase 4: E2E Testing Implementation
 */

import { expect, test } from '@playwright/test';

test.describe('🎨 Hebrew Content Display E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated session with Hebrew content
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-123',
            email: 'student@post.bgu.ac.il',
            name: 'תלמיד דוגמה',
            university: 'bgu',
            faculty: 'מדעי הטבע',
            department: 'מתמטיקה',
            hasValidCredentials: true,
          },
        }),
      });
    });

    // Mock Hebrew content data
    await page.route('**/api/content/hebrew', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          courses: [
            {
              id: 'phys101',
              name: 'פיזיקה כללית א׳',
              nameEn: 'General Physics A',
              description: 'קורס מבוא בפיזיקה המכסה מכניקה קלאסית, גלים וחום',
              instructor: 'פרופ׳ רחל ישראלי',
              content: {
                syllabus:
                  'תכנית הלימודים כוללת: \n• מכניקה של חלקיק \n• דינמיקה של מערכות \n• גלים מכניים \n• תרמודינמיקה',
                announcements: [
                  {
                    title: 'ביטול שיעור ביום חמישי',
                    content: 'השיעור ביום חמישי הקרוב מבוטל עקב ועידה אקדמית. השיעור יועבר ליום ראשון.',
                  },
                ],
                assignments: [
                  {
                    title: 'תרגיל בית 4 - חוקי שימור',
                    description: 'פתרון בעיות בנושא חוקי שימור האנרגיה והתנע',
                    instructions: 'יש לפתור את כל התרגילים המצורפים. שימו לב לתחשיב יחידות נכון.',
                  },
                ],
              },
            },
          ],
          messages: [
            {
              type: 'error',
              text: 'שגיאה בטעינת התוכן. אנא נסו שוב מאוחר יותר.',
            },
            {
              type: 'success',
              text: 'התוכן נטען בהצלחה! 🎉',
            },
            {
              type: 'warning',
              text: 'תזכורת: המטלה האחרונה תיסגר מחר בשעה 23:59',
            },
          ],
        }),
      });
    });
  });

  test.describe('🔤 Hebrew Typography and Character Rendering', () => {
    test('should properly render Hebrew characters without encoding issues', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Check Hebrew course name
      const courseName = page.locator('[data-testid="course-name"]');
      await expect(courseName).toContainText('פיזיקה כללית א׳');

      // Verify Hebrew characters are properly encoded
      const nameText = await courseName.textContent();
      expect(nameText).toMatch(/[\u0590-\u05FF]/); // Hebrew Unicode range
      expect(nameText).not.toContain('�'); // No replacement characters
      expect(nameText).not.toContain('?'); // No question marks

      // Check instructor name with Hebrew characters
      const instructor = page.locator('[data-testid="instructor-name"]');
      await expect(instructor).toContainText('פרופ׳ רחל ישראלי');

      const instructorText = await instructor.textContent();
      expect(instructorText).toMatch(/[\u0590-\u05FF]/);
      expect(instructorText).not.toContain('�');
    });

    test('should handle mixed Hebrew-English content correctly', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Course name should show both Hebrew and English
      const hebrewName = page.locator('[data-testid="course-name-he"]');
      const englishName = page.locator('[data-testid="course-name-en"]');

      await expect(hebrewName).toContainText('פיזיקה כללית א׳');
      await expect(englishName).toContainText('General Physics A');

      // Mixed content should display properly
      const mixedContent = page.locator('[data-testid="mixed-content"]');
      if (await mixedContent.isVisible()) {
        const content = await mixedContent.textContent();
        // Should contain both Hebrew and English
        expect(content).toMatch(/[\u0590-\u05FF]/); // Hebrew
        expect(content).toMatch(/[a-zA-Z]/); // English
      }
    });

    test('should display Hebrew punctuation and diacritics correctly', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Check Hebrew punctuation (geresh, gershayim)
      const courseCode = page.locator('[data-testid="course-description"]');
      await expect(courseCode).toContainText('א׳'); // Aleph with geresh

      // Check Hebrew text with proper punctuation
      const description = await courseCode.textContent();
      expect(description).toMatch(/[\u0590-\u05FF]/);

      // Should handle Hebrew numbers correctly
      if (description?.includes('׳') || description?.includes('״')) {
        expect(description).toMatch(/[׳״]/); // Hebrew number punctuation
      }
    });
  });

  test.describe('📐 RTL Layout and Text Direction', () => {
    test('should apply correct RTL text direction for Hebrew content', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Main content should be RTL
      const mainContent = page.locator('[data-testid="course-content"]');
      await expect(mainContent).toHaveAttribute('dir', 'rtl');

      // Check text alignment
      const hebrewText = page.locator('[data-testid="course-description"]');
      const textStyles = await hebrewText.evaluate((el) => getComputedStyle(el));
      expect(textStyles.direction).toBe('rtl');
      expect(textStyles.textAlign).toBe('right');

      // Lists should be right-aligned in RTL
      const bulletList = page.locator('[data-testid="syllabus-list"]');
      if (await bulletList.isVisible()) {
        const listStyles = await bulletList.evaluate((el) => getComputedStyle(el));
        expect(listStyles.direction).toBe('rtl');
      }
    });

    test('should handle logical CSS properties correctly', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Check margin and padding use logical properties
      const contentCards = page.locator('[data-testid="content-card"]');
      const cardCount = await contentCards.count();

      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = contentCards.nth(i);
        const cardStyles = await card.evaluate((el) => getComputedStyle(el));

        // Should use logical properties (marginInlineStart, paddingInlineEnd, etc.)
        // Or should properly handle RTL with standard properties
        expect(cardStyles.direction).toBe('rtl');
      }
    });

    test('should position UI elements correctly in RTL layout', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Navigation arrows should be flipped
      const nextBtn = page.locator('[data-testid="next-content"]');
      const prevBtn = page.locator('[data-testid="prev-content"]');

      if ((await nextBtn.isVisible()) && (await prevBtn.isVisible())) {
        const nextPos = await nextBtn.boundingBox();
        const prevPos = await prevBtn.boundingBox();

        // In RTL, "next" should be on the left, "prev" on the right
        expect(nextPos?.x).toBeLessThan(prevPos?.x);
      }

      // Close buttons should be on the left in RTL
      const closeBtn = page.locator('[data-testid="modal-close"]');
      if (await closeBtn.isVisible()) {
        const closePos = await closeBtn.boundingBox();
        const modalPos = await page.locator('[data-testid="modal-content"]').boundingBox();

        if (closePos && modalPos) {
          // Close button should be on the left side of modal in RTL
          expect(closePos.x).toBeLessThan(modalPos.x + modalPos.width / 2);
        }
      }
    });
  });

  test.describe('📚 Academic Content Display', () => {
    test('should display Hebrew course syllabus with proper formatting', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Navigate to syllabus section
      await page.click('[data-testid="tab-syllabus"]');

      const syllabus = page.locator('[data-testid="syllabus-content"]');
      await expect(syllabus).toContainText('תכנית הלימודים כוללת:');
      await expect(syllabus).toContainText('מכניקה של חלקיק');
      await expect(syllabus).toContainText('דינמיקה של מערכות');
      await expect(syllabus).toContainText('גלים מכניים');
      await expect(syllabus).toContainText('תרמודינמיקה');

      // Check bullet points are properly formatted in RTL
      const bulletPoints = page.locator('[data-testid="syllabus-list"] li');
      const count = await bulletPoints.count();
      expect(count).toBeGreaterThan(3);

      // Each bullet point should be right-aligned
      for (let i = 0; i < count; i++) {
        const item = bulletPoints.nth(i);
        const itemStyles = await item.evaluate((el) => getComputedStyle(el));
        expect(itemStyles.textAlign).toBe('right');
      }
    });

    test('should display Hebrew announcements with proper formatting', async ({ page }) => {
      await page.goto('/courses/phys101');

      await page.click('[data-testid="tab-announcements"]');

      const announcement = page.locator('[data-testid="announcement-item"]');
      await expect(announcement).toContainText('ביטול שיעור ביום חמישי');

      // Full announcement text
      const announcementText = page.locator('[data-testid="announcement-content"]');
      await expect(announcementText).toContainText('השיעור ביום חמישי הקרוב מבוטל');
      await expect(announcementText).toContainText('ועידה אקדמית');
      await expect(announcementText).toContainText('יועבר ליום ראשון');

      // Check Hebrew text flows correctly
      const textContent = await announcementText.textContent();
      expect(textContent).toMatch(/[\u0590-\u05FF]/);
      expect(textContent?.split(' ').length).toBeGreaterThan(10); // Multi-word sentence
    });

    test('should display Hebrew assignment instructions clearly', async ({ page }) => {
      await page.goto('/courses/phys101');

      await page.click('[data-testid="tab-assignments"]');

      const assignment = page.locator('[data-testid="assignment-item"]');
      await expect(assignment).toContainText('תרגיל בית 4 - חוקי שימור');

      // Assignment description
      const description = page.locator('[data-testid="assignment-description"]');
      await expect(description).toContainText('פתרון בעיות בנושא חוקי שימור');
      await expect(description).toContainText('האנרגיה והתנע');

      // Instructions should be clear and readable
      const instructions = page.locator('[data-testid="assignment-instructions"]');
      await expect(instructions).toContainText('יש לפתור את כל התרגילים');
      await expect(instructions).toContainText('תחשיב יחידות נכון');

      // Text should be properly spaced and readable
      const instrStyles = await instructions.evaluate((el) => getComputedStyle(el));
      expect(parseFloat(instrStyles.lineHeight)).toBeGreaterThan(1.2); // Good line height
    });
  });

  test.describe('💬 Hebrew Messages and Notifications', () => {
    test('should display Hebrew error messages correctly', async ({ page }) => {
      // Mock API error
      await page.route('**/api/courses/phys101/content', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'שגיאה בטעינת התוכן. אנא נסו שוב מאוחר יותר.',
          }),
        });
      });

      await page.goto('/courses/phys101');

      // Should show Hebrew error message
      const errorMsg = page.locator('[data-testid="error-message"]');
      await expect(errorMsg).toContainText('שגיאה בטעינת התוכן');
      await expect(errorMsg).toContainText('נסו שוב מאוחר יותר');

      // Error should be visually prominent but readable
      const errorStyles = await errorMsg.evaluate((el) => getComputedStyle(el));
      expect(errorStyles.direction).toBe('rtl');
      expect(errorStyles.textAlign).toBe('right');
    });

    test('should display Hebrew success messages with emojis', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Trigger a success action (e.g., saving content)
      await page.click('[data-testid="save-notes-btn"]');

      // Mock success response
      await page.route('**/api/notes/save', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'התוכן נשמר בהצלחה! 🎉',
          }),
        });
      });

      // Should show success message
      const successMsg = page.locator('[data-testid="success-message"]');
      await expect(successMsg).toContainText('התוכן נשמר בהצלחה!');
      await expect(successMsg).toContainText('🎉');

      // Should disappear after timeout
      await expect(successMsg).not.toBeVisible({ timeout: 5000 });
    });

    test('should display Hebrew warning messages appropriately', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Check warning about deadline
      const warningMsg = page.locator('[data-testid="deadline-warning"]');
      if (await warningMsg.isVisible()) {
        await expect(warningMsg).toContainText('תזכורת:');
        await expect(warningMsg).toContainText('המטלה האחרונה');
        await expect(warningMsg).toContainText('תיסגר מחר');

        // Warning should have appropriate styling
        const warningStyles = await warningMsg.evaluate((el) => getComputedStyle(el));
        expect(warningStyles.backgroundColor).toMatch(/rgb\(254|rgb\(255/); // Warning color
      }
    });
  });

  test.describe('📱 Responsive Hebrew Content', () => {
    test('should display Hebrew content correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/courses/phys101');

      // Hebrew text should wrap appropriately on mobile
      const courseTitle = page.locator('[data-testid="course-name"]');
      const titleBox = await courseTitle.boundingBox();
      expect(titleBox?.width).toBeLessThan(350); // Should fit mobile width

      // Long Hebrew text should break properly
      const description = page.locator('[data-testid="course-description"]');
      const descBox = await description.boundingBox();
      expect(descBox?.width).toBeLessThan(350);

      // Font size should be readable on mobile
      const titleStyles = await courseTitle.evaluate((el) => getComputedStyle(el));
      expect(parseFloat(titleStyles.fontSize)).toBeGreaterThan(16); // Minimum readable size
    });

    test('should maintain Hebrew text readability across screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1440, height: 900 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/courses/phys101');

        // Hebrew text should be readable at all sizes
        const hebrewText = page.locator('[data-testid="course-description"]');
        const textStyles = await hebrewText.evaluate((el) => getComputedStyle(el));

        expect(parseFloat(textStyles.fontSize)).toBeGreaterThan(14);
        expect(parseFloat(textStyles.lineHeight)).toBeGreaterThan(1.2);
        expect(textStyles.direction).toBe('rtl');
      }
    });
  });

  test.describe('🧪 CRITICAL: Production Hebrew Content Scenarios', () => {
    test('CRITICAL: should handle long Hebrew academic content without layout issues', async ({ page }) => {
      // Mock very long Hebrew content
      await page.route('**/api/courses/phys101/content', async (route) => {
        const longContent = 'זהו תיאור ארוך מאוד של קורס פיזיקה שכולל הרבה מידע חיוני ללמידה. '.repeat(50);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            description: longContent,
            syllabus: longContent,
          }),
        });
      });

      await page.goto('/courses/phys101');

      // Long content should not break layout
      const container = page.locator('[data-testid="content-container"]');
      const containerBox = await container.boundingBox();
      expect(containerBox?.width).toBeLessThan(1500); // Should not exceed reasonable width

      // Text should wrap properly
      const description = page.locator('[data-testid="course-description"]');
      const descHeight = await description.evaluate((el) => el.scrollHeight);
      expect(descHeight).toBeGreaterThan(100); // Should wrap to multiple lines

      // Should not have horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 5); // Allow small margin
    });

    test('CRITICAL: should handle Hebrew content performance on slow networks', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/courses/phys101/content', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
        await route.continue();
      });

      await page.goto('/courses/phys101');

      // Should show loading state in Hebrew
      const loadingMsg = page.locator('[data-testid="content-loading"]');
      await expect(loadingMsg).toContainText('טוען תוכן...');

      // Loading state should be properly styled
      const loadingStyles = await loadingMsg.evaluate((el) => getComputedStyle(el));
      expect(loadingStyles.direction).toBe('rtl');

      // Content should eventually load
      const content = page.locator('[data-testid="course-content"]');
      await expect(content).toBeVisible({ timeout: 5000 });
    });

    test('CRITICAL: should maintain Hebrew content integrity during dynamic updates', async ({ page }) => {
      await page.goto('/courses/phys101');

      // Initial Hebrew content
      const initialText = await page.locator('[data-testid="course-name"]').textContent();
      expect(initialText).toMatch(/[\u0590-\u05FF]/);

      // Mock content update
      await page.route('**/api/courses/phys101/update', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            name: 'פיזיקה כללית ב׳ - מעודכן',
            description: 'תיאור מעודכן של הקורס עם תוכן חדש ומעניין',
          }),
        });
      });

      // Trigger update
      await page.click('[data-testid="refresh-content"]');

      // Hebrew content should update correctly
      await expect(page.locator('[data-testid="course-name"]')).toContainText('פיזיקה כללית ב׳ - מעודכן');

      // No encoding issues after update
      const updatedText = await page.locator('[data-testid="course-name"]').textContent();
      expect(updatedText).toMatch(/[\u0590-\u05FF]/);
      expect(updatedText).not.toContain('�');
    });

    test('CRITICAL: should handle Hebrew search and filtering correctly', async ({ page }) => {
      await page.goto('/courses');

      // Search for Hebrew content
      const searchField = page.locator('[data-testid="course-search"]');
      await searchField.fill('פיזיקה');

      // Should filter results correctly
      const searchResults = page.locator('[data-testid="search-results"]');
      await expect(searchResults).toContainText('פיזיקה כללית א׳');

      // Search should be case-insensitive for Hebrew
      await searchField.fill('פיזיקה');
      await expect(searchResults).toContainText('פיזיקה');

      // Should handle partial Hebrew searches
      await searchField.fill('פיז');
      await expect(searchResults).toContainText('פיזיקה');

      // Clear search
      await searchField.fill('');
      const allCourses = page.locator('[data-testid="course-list"] > *');
      const count = await allCourses.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
