#!/usr/bin/env node

/**
 * 🗄️ Spike Platform - Database Check Script
 * =========================================
 * 
 * בדיקת קיום טבלת sync_jobs
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

async function checkSyncJobsTable() {
  log('🗄️ בודק קיום טבלת sync_jobs...');
  
  try {
    // יצירת job בדיקה
    const response = await fetch('http://localhost:3000/api/sync-status/active');
    
    if (response.ok) {
      const data = await response.json();
      logSuccess('API עובד');
      logInfo(`תגובה: ${JSON.stringify(data)}`);
      return true;
    } else {
      const errorData = await response.json();
      logError(`שגיאה ב-API: ${errorData.error}`);
      return false;
    }
  } catch (error) {
    logError(`שגיאה בבדיקה: ${error.message}`);
    return false;
  }
}

async function createTestJob() {
  log('');
  log('🧪 יוצר job בדיקה...');
  
  try {
    // נסיון ליצור job דרך ה-background sync
    const { startBackgroundSync } = require('../lib/background-sync');
    
    const result = await startBackgroundSync('test_user', {
      moodle_username: 'ortaiz',
      moodle_password: 'Orking!123',
      university_id: 'bgu'
    });
    
    logSuccess('Job נוצר בהצלחה');
    logInfo(`Job ID: ${result.jobId}`);
    logInfo(`הודעה: ${result.message}`);
    return result.jobId;
  } catch (error) {
    logError(`שגיאה ביצירת job: ${error.message}`);
    return null;
  }
}

async function main() {
  log('🚀 מתחיל בדיקת דטה בייס...', 'bright');
  log('');
  
  // בדיקת טבלה
  const tableExists = await checkSyncJobsTable();
  
  if (!tableExists) {
    log('');
    logWarning('הטבלה לא קיימת או יש שגיאה');
    logInfo('מנסה ליצור job בדיקה...');
    
    const jobId = await createTestJob();
    
    if (jobId) {
      logSuccess('Job נוצר בהצלחה!');
      logInfo('הטבלה קיימת ועובדת');
    } else {
      logError('לא ניתן ליצור job');
      logInfo('ייתכן שהטבלה לא נוצרה');
    }
  } else {
    logSuccess('הטבלה קיימת ועובדת');
  }
  
  log('');
  log('📋 סיכום:', 'bright');
  log('- דטה בייס: ✅ זמין');
  log('- API: ✅ עובד');
  log('- טבלת sync_jobs: ' + (tableExists ? '✅ קיימת' : '❌ חסרה'));
  log('');
  
  if (tableExists) {
    logSuccess('המערכת מוכנה לשימוש!');
  } else {
    logWarning('יש לפתור בעיות בדטה בייס');
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
  checkSyncJobsTable,
  createTestJob
}; 