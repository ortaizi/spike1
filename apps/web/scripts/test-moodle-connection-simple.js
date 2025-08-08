#!/usr/bin/env node

/**
 * סקריפט פשוט לבדיקת חיבור למודל
 * =================================
 * 
 * בודק רק את החיבור למודל בלי דאטהבייס
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
 * בדיקת משתני סביבה
 */
function checkEnvironmentVariables() {
  log('🔍 בודק משתני סביבה...', 'blue');
  
  const requiredVars = [
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
 * פונקציה ראשית
 */
async function main() {
  log('🚀 מתחיל בדיקה פשוטה של חיבור למודל...', 'bright');
  log('=====================================');
  
  const results = {
    env: checkEnvironmentVariables(),
    moodle: await testMoodleConnection()
  };
  
  log('');
  log('📊 תוצאות הבדיקה:', 'bright');
  log('=====================================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅' : '❌';
    const name = test === 'env' ? 'משתני סביבה' : 'חיבור למודל';
    log(`${status} ${name}: ${result ? 'עבר' : 'נכשל'}`);
  }
  
  log('');
  log(`⚠️  ${passed}/${total} בדיקות עברו`);
  
  if (passed === total) {
    log('✅ כל הבדיקות עברו בהצלחה!', 'green');
  } else {
    log('❌ יש לתקן את הבעיות לפני המשך', 'red');
  }
}

// הרצת הסקריפט
main().catch(console.error); 