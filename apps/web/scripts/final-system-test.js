#!/usr/bin/env node

/**
 * 🚀 Spike Platform - Final System Test
 * =====================================
 * 
 * בדיקה סופית של המערכת עם הפרטים של ortaiz
 */

// טעינת משתני סביבה
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

// פרטי הבדיקה
const testCredentials = {
  username: 'ortaiz',
  password: 'Orking!123',
  universityId: 'bgu'
};

async function testHealth() {
  log('🏥 בודק בריאות השרת...');
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      logSuccess('השרת בריא');
      logInfo(`זמן תגובה: ${data.responseTime}`);
      logInfo(`זמן פעילות: ${data.uptime}`);
      return true;
    } else {
      logError('השרת לא מגיב');
      return false;
    }
  } catch (error) {
    logError(`שגיאה בבדיקת בריאות: ${error.message}`);
    return false;
  }
}

async function testDatabase() {
  log('');
  log('🗄️ בודק חיבור לדטה בייס...');
  
  try {
    const response = await fetch('http://localhost:3000/api/test-db');
    
    if (response.ok) {
      const data = await response.json();
      logSuccess('חיבור לדטה בייס תקין');
      logInfo(`סטטוס: ${data.status}`);
      return true;
    } else {
      logWarning('לא ניתן לבדוק חיבור לדטה בייס');
      return false;
    }
  } catch (error) {
    logError(`שגיאה בבדיקת דטה בייס: ${error.message}`);
    return false;
  }
}

async function testSyncJobsTable() {
  log('');
  log('🔄 בודק טבלת sync_jobs...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // נסיון ליצור job בדיקה
    const testJob = {
      id: `test_${Date.now()}`,
      user_id: 'test_user',
      status: 'starting',
      progress: 0,
      message: 'Job בדיקה',
      data: { test: true }
    };
    
    const { data, error } = await supabase
      .from('sync_jobs')
      .insert(testJob)
      .select();
    
    if (error) {
      throw error;
    }
    
    logSuccess('טבלת sync_jobs עובדת');
    
    // מחיקת job הבדיקה
    await supabase
      .from('sync_jobs')
      .delete()
      .eq('id', testJob.id);
    
    logInfo('job הבדיקה נמחק');
    return true;
    
  } catch (error) {
    logError(`שגיאה בבדיקת טבלה: ${error.message}`);
    return false;
  }
}

async function testSyncStatusAPI() {
  log('');
  log('📡 בודק API סטטוס סנכרון...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync-status/active');
    
    if (response.ok) {
      const data = await response.json();
      logSuccess('API סטטוס סנכרון עובד');
      logInfo(`תגובה: ${JSON.stringify(data)}`);
      return true;
    } else {
      const errorData = await response.json();
      if (errorData.error === 'לא מורשה') {
        logSuccess('API עובד (שגיאה "לא מורשה" היא תקינה)');
        return true;
      } else {
        logError(`שגיאה ב-API: ${errorData.error}`);
        return false;
      }
    }
  } catch (error) {
    logError(`שגיאה בבדיקת API: ${error.message}`);
    return false;
  }
}

async function testBackgroundSync() {
  log('');
  log('🔄 בודק מערכת סנכרון רקע...');
  
  try {
    // בדיקה שהמודול קיים
    const { startBackgroundSync } = require('../lib/background-sync');
    
    logSuccess('מודול background-sync זמין');
    
    // בדיקה שהפונקציה עובדת
    const result = await startBackgroundSync('test_user', {
      moodle_username: testCredentials.username,
      moodle_password: testCredentials.password,
      university_id: testCredentials.universityId
    });
    
    logSuccess('מערכת סנכרון רקע עובדת');
    logInfo(`Job ID: ${result.jobId}`);
    logInfo(`הודעה: ${result.message}`);
    return true;
    
  } catch (error) {
    logError(`שגיאה בבדיקת סנכרון רקע: ${error.message}`);
    return false;
  }
}

async function testErrorHandler() {
  log('');
  log('🛡️ בודק מערכת טיפול בשגיאות...');
  
  try {
    const { withRetry } = require('../lib/error-handler');
    
    // בדיקה עם פונקציה שתמיד מצליחה
    const successResult = await withRetry(async () => {
      return 'success';
    });
    
    if (successResult === 'success') {
      logSuccess('מערכת טיפול בשגיאות עובדת');
      return true;
    } else {
      logError('מערכת טיפול בשגיאות לא עובדת');
      return false;
    }
    
  } catch (error) {
    logError(`שגיאה בבדיקת מערכת טיפול בשגיאות: ${error.message}`);
    return false;
  }
}

async function main() {
  log('🚀 מתחיל בדיקה סופית של מערכת Spike...', 'bright');
  log('');
  logInfo('פרטי הבדיקה:');
  logInfo(`- משתמש: ${testCredentials.username}`);
  logInfo(`- סיסמה: ${testCredentials.password}`);
  logInfo(`- אוניברסיטה: ${testCredentials.universityId}`);
  log('');
  
  // בדיקות המערכת
  const healthOk = await testHealth();
  const dbOk = await testDatabase();
  const tableOk = await testSyncJobsTable();
  const apiOk = await testSyncStatusAPI();
  const syncOk = await testBackgroundSync();
  const errorOk = await testErrorHandler();
  
  log('');
  log('📋 סיכום בדיקות:', 'bright');
  log(`- בריאות שרת: ${healthOk ? '✅' : '❌'}`);
  log(`- דטה בייס: ${dbOk ? '✅' : '❌'}`);
  log(`- טבלת sync_jobs: ${tableOk ? '✅' : '❌'}`);
  log(`- API סטטוס: ${apiOk ? '✅' : '❌'}`);
  log(`- סנכרון רקע: ${syncOk ? '✅' : '❌'}`);
  log(`- טיפול בשגיאות: ${errorOk ? '✅' : '❌'}`);
  log('');
  
  const allTestsPassed = healthOk && dbOk && tableOk && apiOk && syncOk && errorOk;
  
  if (allTestsPassed) {
    logSuccess('🎉 כל הבדיקות עברו בהצלחה!');
    log('');
    log('🌐 המערכת מוכנה לשימוש:', 'bright');
    log('1. גש ל: http://localhost:3000');
    log('2. לחץ על "התחבר"');
    log('3. הזן את הפרטים:');
    log(`   - שם משתמש: ${testCredentials.username}`);
    log(`   - סיסמה: ${testCredentials.password}`);
    log('   - אוניברסיטה: בן-גוריון');
    log('4. המערכת תתחיל סנכרון אוטומטי');
    log('');
    log('📊 מעקב אחר התקדמות:', 'bright');
    log('- בדוק את הדשבורד להתקדמות');
    log('- הלוגים יופיעו בקונסול השרת');
    log('- ניתן לבדוק סטטוס ב: /api/sync-status/active');
    log('');
    log('🎯 המערכת מוכנה לשימוש עם הפרטים שלך!', 'cyan');
  } else {
    logError('❌ חלק מהבדיקות נכשלו');
    log('');
    log('🔧 פתרון בעיות:', 'bright');
    log('- בדוק שהשרת רץ: npm run dev');
    log('- בדוק משתני סביבה: .env.development');
    log('- בדוק חיבור לדטה בייס');
    log('- בדוק שהטבלאות נוצרו');
  }
}

// הרצת הסקריפט
if (require.main === module) {
  main().catch(error => {
    logError(`שגיאה בהרצת הסקריפט: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testHealth,
  testDatabase,
  testSyncJobsTable,
  testSyncStatusAPI,
  testBackgroundSync,
  testErrorHandler
}; 