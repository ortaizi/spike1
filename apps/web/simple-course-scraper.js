/**
 * סקריפט פשוט לכניסה למודל ושליפת קורסים
 */

const { chromium } = require('playwright');

async function scrapeCourses() {
  console.log('🚀 מתחיל שליפת קורסים ממודל...');
  
  const browser = await chromium.launch({
    headless: false, // נראה את הדפדפן
    slowMo: 1000 // האטה לראות מה קורה
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. כניסה לדף ההתחברות
    console.log('📝 נכנס לדף ההתחברות...');
    await page.goto('https://moodle.bgu.ac.il/login/index.php');
    
    // 2. בדיקה מה יש בדף
    console.log('🔍 בודק את מבנה הדף...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // בדיקה מה יש בדף
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input').length,
        buttons: document.querySelectorAll('button').length
      };
    });
    
    console.log('📄 תוכן הדף:', pageContent);
    
    // 3. מילוי פרטי התחברות - ננסה סלקטורים שונים
    console.log('🔑 ממלא פרטי התחברות...');
    
    // ננסה למצוא את שדות ההתחברות
    const usernameSelectors = ['#username', 'input[name="username"]', 'input[type="text"]'];
    const passwordSelectors = ['#password', 'input[name="password"]', 'input[type="password"]'];
    const loginSelectors = ['#loginbtn', 'button[type="submit"]', 'input[type="submit"]'];
    
    let usernameField = null;
    let passwordField = null;
    let loginButton = null;
    
    for (const selector of usernameSelectors) {
      try {
        usernameField = await page.$(selector);
        if (usernameField) {
          console.log(`✅ נמצא שדה username: ${selector}`);
          break;
        }
      } catch (e) {
        // continue
      }
    }
    
    for (const selector of passwordSelectors) {
      try {
        passwordField = await page.$(selector);
        if (passwordField) {
          console.log(`✅ נמצא שדה password: ${selector}`);
          break;
        }
      } catch (e) {
        // continue
      }
    }
    
    for (const selector of loginSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) {
          console.log(`✅ נמצא כפתור login: ${selector}`);
          break;
        }
      } catch (e) {
        // continue
      }
    }
    
    if (!usernameField || !passwordField || !loginButton) {
      throw new Error('לא נמצאו שדות התחברות');
    }
    
    // מילוי השדות
    await usernameField.type('ortaiz');
    await passwordField.type('your_password_here'); // יש להחליף בסיסמה אמיתית
    
    // 4. לחיצה על כפתור התחברות
    console.log('👆 לוחץ על כפתור התחברות...');
    await loginButton.click();
    
    // 5. המתנה לטעינת הדף
    await page.waitForLoadState('networkidle');
    
    // 6. כניסה לדף הקורסים
    console.log('📚 נכנס לדף הקורסים...');
    await page.goto('https://moodle.bgu.ac.il/my/');
    
    // 7. המתנה לטעינת הקורסים
    await page.waitForLoadState('networkidle');
    
    // 8. שליפת שמות הקורסים
    console.log('📋 שולף שמות קורסים...');
    const courses = await page.evaluate(() => {
      const courseElements = document.querySelectorAll('.course-list .course, .coursebox, .course-item');
      const courseNames = [];
      
      courseElements.forEach((element, index) => {
        const nameElement = element.querySelector('.course-name, .course-title, h3, h4, .title');
        const name = nameElement ? nameElement.textContent.trim() : `קורס ${index + 1}`;
        courseNames.push(name);
      });
      
      return courseNames;
    });
    
    console.log('✅ הקורסים שנמצאו:');
    courses.forEach((course, index) => {
      console.log(`  ${index + 1}. ${course}`);
    });
    
    // 9. שמירה בדאטהבייס
    console.log('💾 שומר בדאטהבייס...');
    await saveCoursesToDatabase(courses);
    
    console.log('🎉 הושלם בהצלחה!');
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await browser.close();
  }
}

async function saveCoursesToDatabase(courses) {
  try {
    // חיבור לדאטהבייס
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = 'https://fnizmtpiyszmmccorscc.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuaXptdHBpeXN6bW1jY29yc2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAwMzE1MCwiZXhwIjoyMDY5NTc5MTUwfQ.GcwMbEGiFJmmyuoKLYRb0tJU7XK0Xdw6Rbp6WtbtynU';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // שמירת כל קורס
    for (const courseName of courses) {
      const { error } = await supabase
        .from('courses')
        .insert({
          id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: courseName,
          code: courseName.split(' ')[0] || 'COURSE',
          description: `קורס: ${courseName}`,
          credits: 3,
          semester: 'א',
          academicyear: 2024,
          faculty: 'מדעי המחשב',
          department: 'מדעי המחשב',
          instructor: 'מרצה',
          isactive: true,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        });
      
      if (error) {
        console.error(`שגיאה בשמירת קורס ${courseName}:`, error);
      } else {
        console.log(`✅ נשמר: ${courseName}`);
      }
    }
    
    console.log('💾 כל הקורסים נשמרו בדאטהבייס!');
    
  } catch (error) {
    console.error('❌ שגיאה בשמירה בדאטהבייס:', error);
  }
}

// הרצת הסקריפט
scrapeCourses()
  .then(() => {
    console.log('🏁 הסקריפט הושלם');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 שגיאה:', error);
    process.exit(1);
  }); 