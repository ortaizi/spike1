/**
 * מודול חיבור למודל (JavaScript)
 * =============================
 * 
 * גרסה JavaScript של מודול החיבור למודל
 * לשימוש בסקריפטים Node.js
 */

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// הגדרות האוניברסיטאות
const UNIVERSITY_CONFIGS = {
  bgu: {
    name: 'Ben-Gurion University',
    moodleUrl: process.env.BGU_MOODLE_URL || 'https://moodle.bgu.ac.il',
    loginUrl: `${process.env.BGU_MOODLE_URL || 'https://moodle.bgu.ac.il'}/`,
    selectors: {
      usernameField: 'input[name="username"], #username, .username input, input[type="text"]',
      passwordField: 'input[name="password"], #password, .password input, input[type="password"]',
      loginButton: 'input[type="submit"], #loginbtn, .loginbtn, button[type="submit"], .btn-primary',
      logoutButton: '.dropdown-toggle, .user-menu',
      courseListSelector: '.course-list, .courses'
    }
  }
  // Other universities coming soon:
  // technion: {
  //   name: 'Technion',
  //   moodleUrl: process.env.TECHNION_MOODLE_URL || 'https://moodle.technion.ac.il',
  //   loginUrl: `${process.env.TECHNION_MOODLE_URL || 'https://moodle.technion.ac.il'}/login/index.php`,
  //   selectors: {
  //     usernameField: 'input[name="username"], #username, .username input',
  //     passwordField: 'input[name="password"], #password, .password input',
  //     loginButton: 'input[type="submit"], #loginbtn, .loginbtn, button[type="submit"]',
  //     logoutButton: '.dropdown-toggle, .user-menu',
  //     courseListSelector: '.course-list, .courses'
  //   }
  // },
  // huji: {
  //   name: 'Hebrew University',
  //   moodleUrl: process.env.HUJI_MOODLE_URL || 'https://moodle.huji.ac.il',
  //   loginUrl: `${process.env.HUJI_MOODLE_URL || 'https://moodle.huji.ac.il'}/login/index.php`,
  //   selectors: {
  //     usernameField: 'input[name="username"], #username, .username input',
  //     passwordField: 'input[name="password"], #password, .password input',
  //     loginButton: 'input[type="submit"], #loginbtn, .loginbtn, button[type="submit"]',
  //     logoutButton: '.dropdown-toggle, .user-menu',
  //     courseListSelector: '.course-list, .courses'
  //   }
  // },
  // tau: {
  //   name: 'Tel Aviv University',
  //   moodleUrl: process.env.TAU_MOODLE_URL || 'https://moodle.tau.ac.il',
  //   loginUrl: `${process.env.TAU_MOODLE_URL || 'https://moodle.tau.ac.il'}/login/index.php`,
  //   selectors: {
  //     usernameField: 'input[name="username"], #username, .username input',
  //     passwordField: 'input[name="password"], #password, .password input',
  //     loginButton: 'input[type="submit"], #loginbtn, .loginbtn, button[type="submit"]',
  //     logoutButton: '.dropdown-toggle, .user-menu',
  //     courseListSelector: '.course-list, .courses'
  //   }
  // }
};

// חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * מחלקת חיבור למודל
 */
class MoodleConnector {
  constructor() {
    this.sessions = new Map();
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 שניות
  }

  /**
   * התחברות למודל
   */
  async connect(credentials) {
    try {
      console.log(`🔗 מתחבר למודל של ${credentials.university}...`);
      
      const config = UNIVERSITY_CONFIGS[credentials.university];
      if (!config) {
        throw new Error(`אוניברסיטה לא נתמכת: ${credentials.university}`);
      }

      // יצירת סשן חדש
      const session = await this.createSession(config);
      
      // התחברות למודל
      const loginResult = await this.loginToMoodle(session, credentials, config);
      
      if (!loginResult.success) {
        await this.closeSession(session);
        return loginResult;
      }

      // שמירת הסשן
      const sessionKey = `${credentials.university}_${credentials.username}`;
      this.sessions.set(sessionKey, session);

      console.log(`✅ התחברות למודל הושלמה בהצלחה`);
      
      return {
        success: true,
        session,
        data: { university: config.name, username: credentials.username }
      };

    } catch (error) {
      console.error(`❌ שגיאה בהתחברות למודל:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  }

  /**
   * יצירת סשן חדש
   */
  async createSession(config) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // הגדרת User Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // הגדרת viewport
    await page.setViewport({ width: 1920, height: 1080 });

    return {
      browser,
      page,
      isLoggedIn: false,
      lastActivity: new Date()
    };
  }

  /**
   * התחברות למודל
   */
  async loginToMoodle(session, credentials, config) {
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ניסיון התחברות ${attempt}/${this.maxRetries}...`);

        // ניווט לדף הבית של Moodle
        console.log(`🌐 ניווט ל: ${config.loginUrl}`);
        await session.page.goto(config.loginUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

                // הדפסת URL נוכחי
        const currentUrl = session.page.url();
        console.log(`📍 URL נוכחי: ${currentUrl}`);
        
        // בדיקה אם המשתמש כבר מחובר
        
        if (currentUrl.includes('mydashboard') || currentUrl.includes('user') || currentUrl.includes('course')) {
          console.log(`✅ המשתמש כבר מחובר למערכת`);
          session.isLoggedIn = true;
          session.lastActivity = new Date();
          return { success: true };
        }
        
        // ניסיון למצוא כפתור התחברות בדף הבית
        console.log(`🔍 מחפש כפתור התחברות בדף הבית...`);
        const loginButton = await session.page.$('a[href*="login"], .login-link, .btn-login, a:contains("התחברות")');
        
        if (loginButton) {
          console.log(`✅ נמצא כפתור התחברות, לוחץ עליו...`);
          try {
            await loginButton.click();
            await session.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
            console.log(`✅ ניווט לדף ההתחברות`);
          } catch (e) {
            console.log(`⚠️ שגיאה בלחיצה על כפתור התחברות: ${e.message}`);
          }
        } else {
          console.log(`⚠️ לא נמצא כפתור התחברות, מנסה ישירות...`);
        }

        // ניסיון למצוא שדות התחברות
        console.log(`🔍 מחפש שדות התחברות...`);
        
        // ניסיון סלקטורים שונים
        const selectors = [
          'input[name="username"]',
          '#username',
          '.username input',
          'input[type="text"]',
          'input[placeholder*="שם משתמש"]',
          'input[placeholder*="username"]'
        ];
        
        let usernameField = null;
        for (const selector of selectors) {
          try {
            usernameField = await session.page.waitForSelector(selector, { timeout: 2000 });
            if (usernameField) {
              console.log(`✅ נמצא שדה שם משתמש עם סלקטור: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`❌ לא נמצא עם סלקטור: ${selector}`);
          }
        }
        
        if (!usernameField) {
          throw new Error('לא נמצא שדה שם משתמש');
        }
        
        let usernameSelector = null;
        for (const selector of selectors) {
          try {
            usernameField = await session.page.waitForSelector(selector, { timeout: 2000 });
            if (usernameField) {
              console.log(`✅ נמצא שדה שם משתמש עם סלקטור: ${selector}`);
              usernameSelector = selector;
              break;
            }
          } catch (e) {
            console.log(`❌ לא נמצא עם סלקטור: ${selector}`);
          }
        }
        
        if (!usernameField) {
          throw new Error('לא נמצא שדה שם משתמש');
        }
        
        await session.page.type(usernameSelector, credentials.username);
        console.log(`📝 מולא שם משתמש`);
        
        // ניסיון למצוא שדה סיסמה
        const passwordSelectors = [
          'input[name="password"]',
          '#password',
          '.password input',
          'input[type="password"]',
          'input[placeholder*="סיסמה"]',
          'input[placeholder*="password"]'
        ];
        
        let passwordField = null;
        let passwordSelector = null;
        for (const selector of passwordSelectors) {
          try {
            passwordField = await session.page.waitForSelector(selector, { timeout: 2000 });
            if (passwordField) {
              console.log(`✅ נמצא שדה סיסמה עם סלקטור: ${selector}`);
              passwordSelector = selector;
              break;
            }
          } catch (e) {
            console.log(`❌ לא נמצא עם סלקטור: ${selector}`);
          }
        }
        
        if (!passwordField) {
          throw new Error('לא נמצא שדה סיסמה');
        }
        
        await session.page.type(passwordSelector, credentials.password);
        console.log(`📝 מולא סיסמה`);

        // ניסיון למצוא כפתור התחברות
        const loginButtonSelectors = [
          'input[type="submit"]',
          '#loginbtn',
          '.loginbtn',
          'button[type="submit"]',
          '.btn-primary',
          'input[value*="התחבר"]'
        ];
        
        let submitButton = null;
        let submitSelector = null;
        for (const selector of loginButtonSelectors) {
          try {
            submitButton = await session.page.waitForSelector(selector, { timeout: 2000 });
            if (submitButton) {
              console.log(`✅ נמצא כפתור התחברות עם סלקטור: ${selector}`);
              submitSelector = selector;
              break;
            }
          } catch (e) {
            console.log(`❌ לא נמצא עם סלקטור: ${selector}`);
          }
        }
        
        if (!submitButton) {
          throw new Error('לא נמצא כפתור התחברות');
        }
        
        await session.page.click(submitSelector);
        console.log(`✅ לחיצה על כפתור התחברות`);
        
        // המתנה לטעינת הדף
        await session.page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // בדיקה אם ההתחברות הצליחה
        const isLoggedIn = await this.checkIfLoggedIn(session.page, config);
        
        if (isLoggedIn) {
          session.isLoggedIn = true;
          session.lastActivity = new Date();
          console.log(`✅ התחברות הצליחה בניסיון ${attempt}`);
          return { success: true };
        } else {
          console.log(`❌ התחברות נכשלה בניסיון ${attempt}`);
          
          if (attempt < this.maxRetries) {
            console.log(`⏳ ממתין ${this.retryDelay}ms לפני ניסיון הבא...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
        }

      } catch (error) {
        console.error(`❌ שגיאה בניסיון ${attempt}:`, error);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ ממתין ${this.retryDelay}ms לפני ניסיון הבא...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    return {
      success: false,
      error: `התחברות נכשלה לאחר ${this.maxRetries} ניסיונות`
    };
  }

  /**
   * בדיקה אם המשתמש מחובר
   */
  async checkIfLoggedIn(page, config) {
    try {
      // בדיקה אם יש אלמנט שמצביע על התחברות
      const loginIndicator = await page.$('.user-menu, .dropdown-toggle, .user-info');
      if (loginIndicator) {
        return true;
      }

      // בדיקה אם יש הודעת שגיאה
      const errorMessage = await page.$('.alert-danger, .error');
      if (errorMessage) {
        const errorText = await errorMessage.evaluate(el => el.textContent);
        console.log(`⚠️ הודעת שגיאה: ${errorText}`);
        return false;
      }

      // בדיקה אם אנחנו עדיין בדף ההתחברות
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('auth')) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('שגיאה בבדיקת מצב התחברות:', error);
      return false;
    }
  }

  /**
   * סגירת סשן
   */
  async closeSession(session) {
    try {
      if (session.browser) {
        await session.browser.close();
      }
    } catch (error) {
      console.error('שגיאה בסגירת סשן:', error);
    }
  }

  /**
   * סגירת כל הסשנים
   */
  async closeAllSessions() {
    for (const session of this.sessions.values()) {
      await this.closeSession(session);
    }
    this.sessions.clear();
  }

  /**
   * שמירת פרטי התחברות בדאטהבייס
   */
  async saveCredentials(userId, credentials) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          moodleUsername: credentials.username,
          moodlePassword: credentials.password, // ⚠️ יש להצפין בסביבת ייצור
          moodleUniversity: credentials.university,
          moodleLastSync: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`שגיאה בשמירת פרטי התחברות: ${error.message}`);
      }

      console.log(`✅ פרטי התחברות נשמרו בהצלחה`);
    } catch (error) {
      console.error('שגיאה בשמירת פרטי התחברות:', error);
      throw error;
    }
  }

  /**
   * טעינת פרטי התחברות מהדאטהבייס
   */
  async loadCredentials(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('moodleUsername, moodlePassword, moodleUniversity, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('שגיאה בטעינת פרטי התחברות:', error);
        return null;
      }

      if (!data.moodleUsername || !data.moodlePassword) {
        return null;
      }

      // שימוש באוניברסיטה השמורה או זיהוי לפי האימייל
      let university = data.moodleUniversity || 'bgu';
      
      if (!university) {
        const email = data.email || '';
        if (email.includes('technion')) university = 'technion';
        else if (email.includes('huji')) university = 'huji';
        else if (email.includes('tau')) university = 'tau';
        else university = 'bgu';
      }

      return {
        username: data.moodleUsername,
        password: data.moodlePassword,
        university
      };
    } catch (error) {
      console.error('שגיאה בטעינת פרטי התחברות:', error);
      return null;
    }
  }

  /**
   * בדיקת חיבור למודל
   */
  async testConnection(credentials) {
    try {
      const result = await this.connect(credentials);
      
      if (result.success && result.session) {
        await this.closeSession(result.session);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  }
}

// יצירת instance גלובלי
const moodleConnector = new MoodleConnector();

module.exports = { moodleConnector }; 