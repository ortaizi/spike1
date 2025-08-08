#!/usr/bin/env node

/**
 * 🔐 Spike Platform - Simple Test Script
 * ======================================
 * 
 * בדיקה פשוטה של המערכת
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

async function testHealth() {
  log('🏥 בודק בריאות השרת...');
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      logSuccess('השרת בריא');
      logInfo(`זמן תגובה: ${data.responseTime}`);
      logInfo(`זמן פעילות: ${data.uptime}`);
      logInfo(`סביבה: ${data.environment}`);
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

async function testSyncStatus() {
  log('');
  log('🔄 בודק סטטוס סנכרון...');
  
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
      return true;
    } else {
      logWarning('לא ניתן לבדוק סטטוס סנכרון');
      return false;
    }
  } catch (error) {
    logError(`שגיאה בבדיקת סטטוס: ${error.message}`);
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

async function main() {
  log('🚀 מתחיל בדיקת מערכת Spike...', 'bright');
  log('');
  logInfo('פרטי הבדיקה:');
  logInfo('- משתמש: ortaiz');
  logInfo('- סיסמה: Orking!123');
  logInfo('- אוניברסיטה: bgu');
  log('');
  
  // בדיקת בריאות
  const healthOk = await testHealth();
  
  // בדיקת סטטוס סנכרון
  const syncOk = await testSyncStatus();
  
  // בדיקת דטה בייס
  const dbOk = await testDatabase();
  
  log('');
  log('📋 סיכום בדיקות:', 'bright');
  log(`- בריאות שרת: ${healthOk ? '✅' : '❌'}`);
  log(`- סטטוס סנכרון: ${syncOk ? '✅' : '❌'}`);
  log(`- דטה בייס: ${dbOk ? '✅' : '❌'}`);
  log('');
  
  if (healthOk) {
    logSuccess('המערכת מוכנה לשימוש!');
    log('');
    log('🌐 הוראות:', 'bright');
    log('1. גש ל: http://localhost:3000');
    log('2. לחץ על "התחבר"');
    log('3. הזן את הפרטים:');
    log('   - שם משתמש: ortaiz');
    log('   - סיסמה: Orking!123');
    log('   - אוניברסיטה: בן-גוריון');
    log('4. המערכת תתחיל סנכרון אוטומטי');
    log('');
    log('📊 מעקב אחר התקדמות:', 'bright');
    log('- בדוק את הדשבורד להתקדמות');
    log('- הלוגים יופיעו בקונסול השרת');
    log('- ניתן לבדוק סטטוס ב: /api/sync-status/active');
  } else {
    logError('המערכת לא מוכנה לשימוש');
    log('');
    log('🔧 פתרון בעיות:', 'bright');
    log('- בדוק שהשרת רץ: npm run dev');
    log('- בדוק משתני סביבה: .env.development');
    log('- בדוק חיבור לדטה בייס');
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
  testSyncStatus,
  testDatabase
}; 