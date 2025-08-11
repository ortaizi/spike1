/**
 * מודול חיבור למודל
 * =================
 * 
 * מודול זה מטפל בחיבור אמיתי למודל של האוניברסיטה
 * כולל ניהול סשן, טיפול בשגיאות ומערכת ניסיונות חוזרים
 */

import { createClient } from '@supabase/supabase-js';
import { chromium, Browser, Page } from 'playwright';
import { env } from "./env"

// טיפוסים
export interface MoodleCredentials {
  username: string;
  password: string;
  university: 'bgu' | 'technion' | 'huji' | 'tau';
}

export interface MoodleSession {
  browser: Browser;
  page: Page;
  isLoggedIn: boolean;
  lastActivity: Date;
}

export interface MoodleConnectionResult {
  success: boolean;
  session?: MoodleSession;
  error?: string;
  data?: any;
}

export interface UniversityConfig {
  name: string;
  moodleUrl: string;
  loginUrl: string;
  selectors: {
    usernameField: string;
    passwordField: string;
    loginButton: string;
    logoutButton?: string;
    courseListSelector?: string;
  };
}

// הגדרות האוניברסיטאות
const UNIVERSITY_CONFIGS: Record<string, UniversityConfig> = {
  bgu: {
    name: 'Ben-Gurion University',
    moodleUrl: env.BGU_MOODLE_URL || 'https://moodle.bgu.ac.il',
    loginUrl: `${env.BGU_MOODLE_URL || 'https://moodle.bgu.ac.il'}/login/index.php`,
    selectors: {
      usernameField: '#username',
      passwordField: '#password',
      loginButton: '#loginbtn',
      logoutButton: '.dropdown-toggle',
      courseListSelector: '.course-list'
    }
  },
  technion: {
    name: 'Technion',
    moodleUrl: env.TECHNION_MOODLE_URL || 'https://moodle.technion.ac.il',
    loginUrl: `${env.TECHNION_MOODLE_URL || 'https://moodle.technion.ac.il'}/login/index.php`,
    selectors: {
      usernameField: '#username',
      passwordField: '#password',
      loginButton: '#loginbtn',
      logoutButton: '.dropdown-toggle',
      courseListSelector: '.course-list'
    }
  },
  huji: {
    name: 'Hebrew University',
    moodleUrl: env.HUJI_MOODLE_URL || 'https://moodle.huji.ac.il',
    loginUrl: `${env.HUJI_MOODLE_URL || 'https://moodle.huji.ac.il'}/login/index.php`,
    selectors: {
      usernameField: '#username',
      passwordField: '#password',
      loginButton: '#loginbtn',
      logoutButton: '.dropdown-toggle',
      courseListSelector: '.course-list'
    }
  },
  tau: {
    name: 'Tel Aviv University',
    moodleUrl: env.TAU_MOODLE_URL || 'https://moodle.tau.ac.il',
    loginUrl: `${env.TAU_MOODLE_URL || 'https://moodle.tau.ac.il'}/login/index.php`,
    selectors: {
      usernameField: '#username',
      passwordField: '#password',
      loginButton: '#loginbtn',
      logoutButton: '.dropdown-toggle',
      courseListSelector: '.course-list'
    }
  }
};

// חיבור ל-Supabase
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * מחלקת חיבור למודל
 */
export class MoodleConnector {
  private sessions: Map<string, MoodleSession> = new Map();
  private maxRetries = 3;
  private retryDelay = 2000; // 2 שניות

  /**
   * התחברות למודל
   */
  async connect(credentials: MoodleCredentials): Promise<MoodleConnectionResult> {
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
  private async createSession(config: UniversityConfig): Promise<MoodleSession> {
    const browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

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
  private async loginToMoodle(
    session: MoodleSession, 
    credentials: MoodleCredentials, 
    config: UniversityConfig
  ): Promise<MoodleConnectionResult> {
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ניסיון התחברות ${attempt}/${this.maxRetries}...`);

        // ניווט לדף ההתחברות
        await session.page.goto(config.loginUrl);
        await session.page.waitForLoadState('networkidle');

        // בדיקה אם המשתמש כבר מחובר
        const isAlreadyLoggedIn = await this.checkIfLoggedIn(session.page, config);
        if (isAlreadyLoggedIn) {
          console.log(`✅ המשתמש כבר מחובר למערכת`);
          session.isLoggedIn = true;
          session.lastActivity = new Date();
          return { success: true };
        }

        // מילוי פרטי התחברות
        await session.page.waitForSelector(config.selectors.usernameField);
        await session.page.type(config.selectors.usernameField, credentials.username);
        await session.page.type(config.selectors.passwordField, credentials.password);

        // לחיצה על כפתור התחברות
        await session.page.click(config.selectors.loginButton);
        
        // המתנה לטעינת הדף
        await session.page.waitForLoadState('networkidle');

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
  private async checkIfLoggedIn(page: Page, config: UniversityConfig): Promise<boolean> {
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
  async closeSession(session: MoodleSession): Promise<void> {
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
  async closeAllSessions(): Promise<void> {
    for (const session of this.sessions.values()) {
      await this.closeSession(session);
    }
    this.sessions.clear();
  }

  /**
   * שמירת פרטי התחברות בדאטהבייס
   */
  async saveCredentials(userId: string, credentials: MoodleCredentials): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          moodleUsername: credentials.username,
          moodlePassword: credentials.password, // ⚠️ יש להצפין בסביבת ייצור
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
  async loadCredentials(userId: string): Promise<MoodleCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('moodleUsername, moodlePassword')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('שגיאה בטעינת פרטי התחברות:', error);
        return null;
      }

      if (!data.moodleUsername || !data.moodlePassword) {
        return null;
      }

      // זיהוי האוניברסיטה לפי האימייל
      const email = (data as any).email || '';
      let university: 'bgu' | 'technion' | 'huji' | 'tau' = 'bgu';
      
      if (email.includes('technion')) university = 'technion';
      else if (email.includes('huji')) university = 'huji';
      else if (email.includes('tau')) university = 'tau';

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
  async testConnection(credentials: MoodleCredentials): Promise<MoodleConnectionResult> {
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
export const moodleConnector = new MoodleConnector(); 