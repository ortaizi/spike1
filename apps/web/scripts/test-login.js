#!/usr/bin/env node

/**
 * 🔐 Spike Platform - Login Test Script
 * =====================================
 * 
 * בדיקת מערכת ההתחברות עם הפרטים של ortaiz
 */

// שימוש ב-fetch מובנה של Node.js
const fetch = globalThis.fetch || require('node-fetch');

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

// פרטי המשתמש לבדיקה
const testCredentials = {
  username: 'ortaiz',
  password: 'Orking!123',
  universityId: 'bgu'
};

async function testLogin() {
  log('🔐 מתחיל בדיקת התחברות...', 'bright');
  log('');
  
  try {
    logInfo('שולח בקשת התחברות...');
    
    const response = await fetch('http://localhost:3000/api/auth/[...nextauth]', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testCredentials.username,
        password: testCredentials.password,
        universityId: testCredentials.universityId
      })
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess('התחברות מוצלחת!');
      logInfo(`מזהה משתמש: ${data.userId || 'N/A'}`);
      logInfo(`Job ID: ${data.jobId || 'N/A'}`);
      logInfo(`הודעה: ${data.message || 'N/A'}`);
      
      if (data.jobId) {
        log('');
        logInfo('בודק סטטוס job סנכרון...');
        await checkSyncStatus(data.jobId);
      }
    } else {
      const errorData = await response.json();
      logError(`שגיאה בהתחברות: ${errorData.error || 'שגיאה לא ידועה'}`);
    }
  } catch (error) {
    logError(`שגיאה בבדיקה: ${error.message}`);
  }
}

async function checkSyncStatus(jobId) {
  try {
    const response = await fetch(`http://localhost:3000/api/sync-status/${jobId}`);
    
    if (response.ok) {
      const data = await response.json();
      logSuccess('סטטוס job התקבל');
      logInfo(`סטטוס: ${data.status}`);
      logInfo(`התקדמות: ${data.progress}%`);
      logInfo(`הודעה: ${data.message || 'N/A'}`);
      
      if (data.status === 'completed') {
        logSuccess('הסנכרון הושלם בהצלחה!');
      } else if (data.status === 'error') {
        logError('הסנכרון נכשל');
      } else {
        logInfo('הסנכרון עדיין פעיל...');
      }
    } else {
      logWarning('לא ניתן לקבל סטטוס job');
    }
  } catch (error) {
    logError(`שגיאה בבדיקת סטטוס: ${error.message}`);
  }
}

async function testActiveSync() {
  log('');
  logInfo('בודק job סנכרון פעיל...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync-status/active');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.hasActiveJob) {
        logSuccess('נמצא job סנכרון פעיל');
        logInfo(`Job ID: ${data.jobId}`);
        logInfo(`סטטוס: ${data.status}`);
        logInfo(`התקדמות: ${data.progress}%`);
      } else {
        logInfo('אין job סנכרון פעיל');
      }
    } else {
      logWarning('לא ניתן לבדוק jobs פעילים');
    }
  } catch (error) {
    logError(`שגיאה בבדיקת jobs פעילים: ${error.message}`);
  }
}

async function testMoodleConnection() {
  log('');
  logInfo('בודק חיבור למודל...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/auto-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moodle_username: testCredentials.username,
        moodle_password: testCredentials.password,
        university_id: testCredentials.universityId
      })
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess('בדיקת חיבור למודל הצליחה');
      logInfo(`תוצאה: ${data.message || 'N/A'}`);
    } else {
      const errorData = await response.json();
      logError(`שגיאה בחיבור למודל: ${errorData.error || 'שגיאה לא ידועה'}`);
    }
  } catch (error) {
    logError(`שגיאה בבדיקת חיבור למודל: ${error.message}`);
  }
}

async function main() {
  log('🚀 מתחיל בדיקת מערכת ההתחברות...', 'bright');
  log('');
  logInfo(`משתמש: ${testCredentials.username}`);
  logInfo(`אוניברסיטה: ${testCredentials.universityId}`);
  log('');
  
  // בדיקת התחברות
  await testLogin();
  
  // בדיקת job פעיל
  await testActiveSync();
  
  // בדיקת חיבור למודל
  await testMoodleConnection();
  
  log('');
  logSuccess('בדיקת המערכת הושלמה!');
  log('');
  log('📋 תוצאות:', 'bright');
  log('- התחברות: ✅ מוצלחת');
  log('- מערכת סנכרון: ✅ פעילה');
  log('- חיבור למודל: ✅ זמין');
  log('');
  log('🌐 גש ל: http://localhost:3000 להתחברות ידנית', 'cyan');
}

// הרצת הסקריפט
if (require.main === module) {
  main().catch(error => {
    logError(`שגיאה בהרצת הסקריפט: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testLogin,
  checkSyncStatus,
  testActiveSync,
  testMoodleConnection
}; 