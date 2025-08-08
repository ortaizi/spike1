#!/usr/bin/env node

/**
 * בדיקה מקיפה של שלב 2 - חיבור אמיתי למודל
 * ===========================================
 * 
 * בודק את כל הרכיבים של שלב 2:
 * 2.1 - הגדרת פרטי התחברות
 * 2.2 - פיתוח מודול חיבור למודל
 */

require('dotenv').config({ path: '.env.development' });

// צבעים ללוגים
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * בדיקת שלב 2.1 - הגדרת פרטי התחברות
 */
async function testCredentialsSetup() {
  log('🔍 בודק שלב 2.1 - הגדרת פרטי התחברות...', 'blue');
  
  try {
    // בדיקת משתני סביבה
    const requiredVars = [
      'BGU_MOODLE_URL',
      'TECHNION_MOODLE_URL',
      'HUJI_MOODLE_URL',
      'TAU_MOODLE_URL'
    ];
    
    const missingVars = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      log(`❌ חסרים משתני סביבה: ${missingVars.join(', ')}`, 'red');
      return false;
    }
    
    log('✅ כל משתני הסביבה קיימים', 'green');
    
    // בדיקת קונפיגורציה של האוניברסיטאות
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    // בדיקת קונפיגורציה של BGU
    const bguConfig = moodleConnector.constructor.name === 'MoodleConnector' ? 
      'MoodleConnector class exists' : 'MoodleConnector class not found';
    
    log(`✅ ${bguConfig}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ שגיאה בבדיקת פרטי התחברות: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקת שלב 2.2 - פיתוח מודול חיבור למודל
 */
async function testMoodleConnectionModule() {
  log('🔍 בודק שלב 2.2 - פיתוח מודול חיבור למודל...', 'blue');
  
  try {
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    // בדיקת קיום המחלקה
    if (!moodleConnector) {
      log('❌ MoodleConnector לא נמצא', 'red');
      return false;
    }
    
    log('✅ MoodleConnector נמצא', 'green');
    
    // בדיקת פונקציות נדרשות
    const requiredMethods = [
      'connect',
      'testConnection',
      'saveCredentials',
      'loadCredentials',
      'closeSession',
      'closeAllSessions'
    ];
    
    const missingMethods = [];
    for (const method of requiredMethods) {
      if (typeof moodleConnector[method] !== 'function') {
        missingMethods.push(method);
      }
    }
    
    if (missingMethods.length > 0) {
      log(`❌ חסרות פונקציות: ${missingMethods.join(', ')}`, 'red');
      return false;
    }
    
    log('✅ כל הפונקציות הנדרשות קיימות', 'green');
    
    // בדיקת חיבור אמיתי למודל
    const testCredentials = {
      username: 'ortaiz',
      password: 'Orking!123',
      university: 'bgu'
    };
    
    log('🔄 בודק חיבור אמיתי למודל...', 'yellow');
    const result = await moodleConnector.testConnection(testCredentials);
    
    if (result.success) {
      log('✅ חיבור למודל עובד', 'green');
      log(`📊 פרטי החיבור: ${JSON.stringify(result.data)}`, 'cyan');
    } else {
      log(`❌ חיבור למודל נכשל: ${result.error}`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ שגיאה בבדיקת מודול חיבור למודל: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקת מערכת ניהול סשן
 */
async function testSessionManagement() {
  log('🔍 בודק מערכת ניהול סשן...', 'blue');
  
  try {
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    // בדיקת יצירת סשן
    const testCredentials = {
      username: 'ortaiz',
      password: 'Orking!123',
      university: 'bgu'
    };
    
    log('🔄 בודק יצירת סשן...', 'yellow');
    const connectionResult = await moodleConnector.connect(testCredentials);
    
    if (connectionResult.success && connectionResult.session) {
      log('✅ יצירת סשן הצליחה', 'green');
      
      // בדיקת סגירת סשן
      log('🔄 בודק סגירת סשן...', 'yellow');
      await moodleConnector.closeSession(connectionResult.session);
      log('✅ סגירת סשן הצליחה', 'green');
      
      return true;
    } else {
      log(`❌ יצירת סשן נכשלה: ${connectionResult.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ שגיאה בבדיקת ניהול סשן: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקת מערכת ניסיונות חוזרים
 */
async function testRetrySystem() {
  log('🔍 בודק מערכת ניסיונות חוזרים...', 'blue');
  
  try {
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    // בדיקת חיבור עם פרטים שגויים (אמור להיכשל)
    const wrongCredentials = {
      username: 'wrong_user',
      password: 'wrong_password',
      university: 'bgu'
    };
    
    log('🔄 בודק טיפול בשגיאות...', 'yellow');
    const result = await moodleConnector.testConnection(wrongCredentials);
    
    if (!result.success) {
      log('✅ מערכת טיפול בשגיאות עובדת', 'green');
      log(`📊 הודעת שגיאה: ${result.error}`, 'cyan');
      return true;
    } else {
      log('❌ מערכת טיפול בשגיאות לא עובדת כמו שצריך', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ שגיאה בבדיקת מערכת ניסיונות חוזרים: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקת שמירת פרטי התחברות
 */
async function testCredentialsStorage() {
  log('🔍 בודק שמירת פרטי התחברות...', 'blue');
  
  try {
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    const testCredentials = {
      username: 'test_user',
      password: 'test_password',
      university: 'bgu'
    };
    
    const testUserId = 'test_user_123';
    
    // בדיקת שמירת פרטי התחברות
    log('🔄 בודק שמירת פרטי התחברות...', 'yellow');
    await moodleConnector.saveCredentials(testUserId, testCredentials);
    log('✅ שמירת פרטי התחברות הצליחה', 'green');
    
    // בדיקת טעינת פרטי התחברות
    log('🔄 בודק טעינת פרטי התחברות...', 'yellow');
    const loadedCredentials = await moodleConnector.loadCredentials(testUserId);
    
    if (loadedCredentials) {
      log('✅ טעינת פרטי התחברות הצליחה', 'green');
      log(`📊 פרטים נטענו: ${JSON.stringify(loadedCredentials)}`, 'cyan');
      return true;
    } else {
      log('❌ טעינת פרטי התחברות נכשלה', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ שגיאה בבדיקת שמירת פרטי התחברות: ${error.message}`, 'red');
    return false;
  }
}

/**
 * פונקציה ראשית
 */
async function main() {
  log('🚀 מתחיל בדיקה מקיפה של שלב 2...', 'bright');
  log('=====================================');
  
  const results = {
    credentialsSetup: await testCredentialsSetup(),
    moodleConnectionModule: await testMoodleConnectionModule(),
    sessionManagement: await testSessionManagement(),
    retrySystem: await testRetrySystem(),
    credentialsStorage: await testCredentialsStorage()
  };
  
  log('');
  log('📊 תוצאות הבדיקה של שלב 2:', 'bright');
  log('=====================================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  const testNames = {
    credentialsSetup: 'הגדרת פרטי התחברות (2.1)',
    moodleConnectionModule: 'מודול חיבור למודל (2.2)',
    sessionManagement: 'ניהול סשן',
    retrySystem: 'מערכת ניסיונות חוזרים',
    credentialsStorage: 'שמירת פרטי התחברות'
  };
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅' : '❌';
    const name = testNames[test] || test;
    log(`${status} ${name}: ${result ? 'עבר' : 'נכשל'}`);
  }
  
  log('');
  log(`⚠️  ${passed}/${total} בדיקות עברו`);
  
  if (passed === total) {
    log('✅ שלב 2 הושלם בהצלחה!', 'green');
    log('🎉 המערכת מוכנה לשלב 3 - איסוף נתונים', 'bright');
  } else {
    log('❌ יש לתקן את הבעיות לפני המשך לשלב 3', 'red');
  }
}

// הרצת הסקריפט
main().catch(console.error); 