#!/usr/bin/env node

/**
 * 🗄️ Spike Platform - Create Sync Jobs Table
 * ===========================================
 * 
 * יצירת טבלת sync_jobs דרך Supabase
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

async function createSyncJobsTable() {
  log('🗄️ יוצר טבלת sync_jobs...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('חסרים משתני סביבה של Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // SQL ליצירת הטבלה
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS sync_jobs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'starting',
        progress INTEGER NOT NULL DEFAULT 0,
        message TEXT,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- אינדקסים לביצועים
      CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at);
    `;
    
    // הרצת ה-SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      throw error;
    }
    
    logSuccess('טבלת sync_jobs נוצרה בהצלחה');
    return true;
    
  } catch (error) {
    logError(`שגיאה ביצירת טבלה: ${error.message}`);
    return false;
  }
}

async function testSyncJobsTable() {
  log('');
  log('🧪 בודק את הטבלה...');
  
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
    
    logSuccess('ניתן ליצור jobs בטבלה');
    
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

async function main() {
  log('🚀 מתחיל יצירת טבלת sync_jobs...', 'bright');
  log('');
  
  // יצירת הטבלה
  const tableCreated = await createSyncJobsTable();
  
  if (tableCreated) {
    // בדיקת הטבלה
    const tableWorks = await testSyncJobsTable();
    
    log('');
    log('📋 סיכום:', 'bright');
    log('- יצירת טבלה: ' + (tableCreated ? '✅' : '❌'));
    log('- בדיקת טבלה: ' + (tableWorks ? '✅' : '❌'));
    log('');
    
    if (tableWorks) {
      logSuccess('הטבלה נוצרה ועובדת בהצלחה!');
      log('');
      log('🌐 עכשיו ניתן להשתמש במערכת:', 'bright');
      log('1. גש ל: http://localhost:3000');
      log('2. התחבר עם הפרטים שלך');
      log('3. המערכת תתחיל סנכרון אוטומטי');
    } else {
      logError('הטבלה נוצרה אבל יש בעיות');
    }
  } else {
    logError('לא ניתן ליצור את הטבלה');
    log('');
    log('🔧 פתרון בעיות:', 'bright');
    log('- בדוק חיבור ל-Supabase');
    log('- בדוק הרשאות משתמש');
    log('- נסה ליצור את הטבלה ידנית');
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
  createSyncJobsTable,
  testSyncJobsTable
}; 