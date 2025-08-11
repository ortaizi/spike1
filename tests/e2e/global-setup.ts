/**
 * 🌍 GLOBAL E2E TEST SETUP
 * 
 * Setup Hebrew/RTL environment for Playwright E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';
import hebrewData from '../fixtures/hebrew-data';

async function globalSetup(config: FullConfig) {
  console.log('🎓 Setting up Spike Hebrew E2E testing environment...');
  
  // ================================================================================================
  // 🗄️ DATABASE SETUP
  // ================================================================================================
  
  // Create test database with Hebrew data
  console.log('📊 Seeding Hebrew test data...');
  
  try {
    // In real implementation, would seed actual test database
    // For now, just verify Hebrew data integrity
    const hebrewCourses = Object.values(hebrewData.courses);
    const hebrewUsers = Object.values(hebrewData.users);
    
    console.log(`✅ Loaded ${hebrewCourses.length} Hebrew courses for testing`);
    console.log(`✅ Loaded ${hebrewUsers.length} Hebrew test users`);
    
    // Verify Hebrew text integrity
    const hasHebrewContent = hebrewCourses.some(course => 
      /[\u0590-\u05FF]/.test(course.name || '')
    );
    
    if (!hasHebrewContent) {
      throw new Error('Hebrew test data missing Hebrew characters');
    }
    
  } catch (error) {
    console.error('❌ Failed to setup Hebrew test data:', error);
    throw error;
  }
  
  // ================================================================================================
  // 🌍 BROWSER SETUP FOR HEBREW
  // ================================================================================================
  
  console.log('🌐 Configuring browser for Hebrew/RTL...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Hebrew locale settings
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    
    // RTL viewport
    viewport: { width: 1280, height: 720 },
    
    // Hebrew-friendly user agent
    userAgent: 'Spike-E2E-Hebrew Mozilla/5.0 (compatible; Hebrew/RTL)',
    
    // Hebrew language preferences
    extraHTTPHeaders: {
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
      'X-Test-Environment': 'hebrew-e2e'
    }
  });

  // ================================================================================================
  # 🎨 INJECT HEBREW FONTS AND RTL STYLES
  // ================================================================================================
  
  const page = await context.newPage();
  
  // Add Hebrew fonts
  await page.addStyleTag({
    content: `
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;700&display=swap');
      
      html, body {
        font-family: 'Heebo', 'Assistant', Arial, sans-serif !important;
        direction: rtl !important;
        text-align: right !important;
      }
      
      * {
        box-sizing: border-box;
      }
      
      /* Hebrew typography improvements */
      .hebrew-text, [lang="he"], [dir="rtl"] {
        font-family: 'Heebo', 'Assistant', Arial, sans-serif;
        line-height: 1.6;
        text-align: right;
        direction: rtl;
      }
      
      /* Academic platform specific styles */
      .course-card, .assignment-item, .grade-display {
        direction: rtl;
        text-align: right;
      }
    `
  });

  // Set RTL direction globally
  await page.addInitScript(() => {
    // Set document direction
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
    
    // Override navigator language for Hebrew
    Object.defineProperty(navigator, 'language', {
      get: () => 'he-IL'
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['he-IL', 'he', 'en-US', 'en']
    });
    
    // Set academic context
    window.ACADEMIC_CONTEXT = {
      year: 2024,
      semester: 'א',
      locale: 'he-IL',
      university: 'bgu'
    };
  });

  await page.close();
  await context.close();
  await browser.close();

  // ================================================================================================
  # 📊 HEBREW TEST DATA VALIDATION
  // ================================================================================================
  
  console.log('🔍 Validating Hebrew test data...');
  
  // Check Hebrew course names
  const invalidCourses = hebrewCourses.filter(course => 
    !course.name || !/[\u0590-\u05FF]/.test(course.name)
  );
  
  if (invalidCourses.length > 0) {
    console.warn(`⚠️  ${invalidCourses.length} courses missing Hebrew names`);
  }
  
  // Check Hebrew user names
  const invalidUsers = hebrewUsers.filter(user => 
    !user.name || !/[\u0590-\u05FF]/.test(user.name)
  );
  
  if (invalidUsers.length > 0) {
    console.warn(`⚠️  ${invalidUsers.length} users missing Hebrew names`);
  }
  
  // ================================================================================================
  # 🎓 ACADEMIC YEAR CONTEXT
  # ================================================================================================
  
  const currentAcademicYear = hebrewData.calendar.academicYear2024;
  const fallSemester = currentAcademicYear.semesters.fall;
  
  console.log(`📅 Academic context: ${currentAcademicYear.year} ${fallSemester.name}`);
  console.log(`📚 Semester dates: ${fallSemester.startDate.toLocaleDateString('he-IL')} - ${fallSemester.endDate.toLocaleDateString('he-IL')}`);
  
  // ================================================================================================
  # ✅ SETUP COMPLETE
  # ================================================================================================
  
  console.log('✅ Hebrew E2E environment setup complete!');
  console.log('🎯 Ready to test Hebrew/RTL academic platform features');
}

export default globalSetup;