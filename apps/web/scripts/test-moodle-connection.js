#!/usr/bin/env node

/**
 * סקריפט לבדיקת חיבור למודל
 * ===========================
 * 
 * סקריפט זה בודק את החיבור למודל של האוניברסיטה
 * ומאמת שהמערכת יכולה להתחבר ולאסוף נתונים
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
 * בדיקת משתני סביבה
 */
function checkEnvironmentVariables() {
  log('🔍 בודק משתני סביבה...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'BGU_MOODLE_URL'
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
  return true;
}

/**
 * בדיקת חיבור לדאטהבייס
 */
async function checkDatabaseConnection() {
  log('🔍 בודק חיבור לדאטהבייס...', 'blue');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // בדיקת חיבור
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`❌ שגיאה בחיבור לדאטהבייס: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ חיבור לדאטהבייס תקין', 'green');
    return true;
    
  } catch (error) {
    log(`❌ שגיאה בחיבור לדאטהבייס: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקת חיבור למודל
 */
async function testMoodleConnection() {
  log('🔍 בודק חיבור למודל...', 'blue');
  
  try {
    // טעינת המודול
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    // פרטי התחברות לבדיקה
    const testCredentials = {
      username: 'ortaiz',
      password: 'Orking!123',
      university: 'bgu'
    };
    
    log(`🔄 מתחבר למודל של ${testCredentials.university}...`, 'yellow');
    
    // בדיקת חיבור
    const result = await moodleConnector.testConnection(testCredentials);
    
    if (result.success) {
      log('✅ חיבור למודל הצליח!', 'green');
      log(`📊 פרטים: ${JSON.stringify(result.data)}`, 'cyan');
      return true;
    } else {
      log(`❌ חיבור למודל נכשל: ${result.error}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ שגיאה בבדיקת חיבור למודל: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקת שמירת פרטי התחברות
 */
async function testCredentialsStorage() {
  log('🔍 בודק שמירת פרטי התחברות...', 'blue');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const { moodleConnector } = require('../lib/moodle-connector.js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // מציאת משתמש לבדיקה
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (error || !users || users.length === 0) {
      log('❌ לא נמצא משתמש לבדיקה', 'red');
      return false;
    }
    
    const testUser = users[0];
    log(`👤 בודק עם משתמש: ${testUser.email}`, 'cyan');
    
    // פרטי התחברות לבדיקה
    const testCredentials = {
      username: 'test_user',
      password: 'test_password',
      university: 'bgu'
    };
    
    // שמירת פרטי התחברות
    await moodleConnector.saveCredentials(testUser.id, testCredentials);
    log('✅ פרטי התחברות נשמרו בהצלחה', 'green');
    
    // טעינת פרטי התחברות
    const loadedCredentials = await moodleConnector.loadCredentials(testUser.id);
    
    if (loadedCredentials) {
      log('✅ פרטי התחברות נטענו בהצלחה', 'green');
      log(`📊 פרטים: ${JSON.stringify(loadedCredentials)}`, 'cyan');
      return true;
    } else {
      log('❌ לא ניתן לטעון פרטי התחברות', 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ שגיאה בבדיקת שמירת פרטי התחברות: ${error.message}`, 'red');
    return false;
  }
}

/**
 * בדיקה מקיפה של המערכת
 */
async function comprehensiveTest() {
  log('🚀 מתחיל בדיקה מקיפה של המערכת...', 'bright');
  log('=====================================', 'bright');
  
  const results = {
    environment: false,
    database: false,
    moodle: false,
    credentials: false
  };
  
  // בדיקת משתני סביבה
  results.environment = checkEnvironmentVariables();
  
  if (!results.environment) {
    log('❌ בדיקת משתני סביבה נכשלה', 'red');
    return results;
  }
  
  // בדיקת חיבור לדאטהבייס
  results.database = await checkDatabaseConnection();
  
  if (!results.database) {
    log('❌ בדיקת חיבור לדאטהבייס נכשלה', 'red');
    return results;
  }
  
  // בדיקת חיבור למודל
  results.moodle = await testMoodleConnection();
  
  if (!results.moodle) {
    log('❌ בדיקת חיבור למודל נכשלה', 'red');
    return results;
  }
  
  // בדיקת שמירת פרטי התחברות
  results.credentials = await testCredentialsStorage();
  
  return results;
}

/**
 * הדפסת תוצאות
 */
function printResults(results) {
  log('\n=====================================', 'bright');
  log('📊 תוצאות הבדיקה:', 'bright');
  log('=====================================', 'bright');
  
  const checks = [
    { name: 'משתני סביבה', result: results.environment },
    { name: 'חיבור לדאטהבייס', result: results.database },
    { name: 'חיבור למודל', result: results.moodle },
    { name: 'שמירת פרטי התחברות', result: results.credentials }
  ];
  
  let successCount = 0;
  
  for (const check of checks) {
    const status = check.result ? '✅' : '❌';
    const color = check.result ? 'green' : 'red';
    log(`${status} ${check.name}: ${check.result ? 'עבר' : 'נכשל'}`, color);
    
    if (check.result) successCount++;
  }
  
  log('\n=====================================', 'bright');
  
  if (successCount === checks.length) {
    log('🎉 כל הבדיקות עברו בהצלחה!', 'green');
    log('✅ המערכת מוכנה לאינטגרציה עם Moodle', 'green');
  } else {
    log(`⚠️  ${successCount}/${checks.length} בדיקות עברו`, 'yellow');
    log('❌ יש לתקן את הבעיות לפני המשך', 'red');
  }
  
  log('=====================================', 'bright');
}

/**
 * פונקציה ראשית
 */
async function main() {
  try {
    const results = await comprehensiveTest();
    printResults(results);
    
    if (Object.values(results).every(result => result)) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    log(`💥 שגיאה קריטית: ${error.message}`, 'red');
    process.exit(1);
  }
}

// הרצת הסקריפט
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkDatabaseConnection,
  testMoodleConnection,
  testCredentialsStorage,
  comprehensiveTest
}; 