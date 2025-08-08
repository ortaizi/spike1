#!/usr/bin/env node

/**
 * 🗄️ Spike Platform - Check Table Exists
 * =======================================
 * 
 * בדיקה אם טבלת sync_jobs קיימת
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

async function checkTableExists() {
  log('🗄️ בודק אם טבלת sync_jobs קיימת...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('חסרים משתני סביבה של Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // נסיון לקרוא מהטבלה
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        // טבלה לא קיימת
        logWarning('טבלת sync_jobs לא קיימת');
        return false;
      } else {
        throw error;
      }
    } else {
      logSuccess('טבלת sync_jobs קיימת');
      logInfo(`מספר רשומות: ${data?.length || 0}`);
      return true;
    }
    
  } catch (error) {
    logError(`שגיאה בבדיקת טבלה: ${error.message}`);
    return false;
  }
}

async function createTableManually() {
  log('');
  log('🔧 הוראות ליצירת טבלה ידנית:', 'bright');
  log('');
  log('1. גש ל-Supabase Dashboard:', 'cyan');
  log('   https://supabase.com/dashboard/project/fnizmtpiyszmmccorscc');
  log('');
  log('2. לחץ על "SQL Editor" בתפריט הצד');
  log('');
  log('3. העתק והדבק את הקוד הבא:', 'cyan');
  log('');
  log(`
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
  `, 'yellow');
  log('');
  log('4. לחץ על "Run" להרצת הקוד');
  log('');
  log('5. חזור לכאן והרץ שוב את הבדיקה');
  log('');
}

async function testTableAfterCreation() {
  log('');
  log('🧪 בודק את הטבלה אחרי יצירה...');
  
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
  log('🚀 מתחיל בדיקת טבלת sync_jobs...', 'bright');
  log('');
  
  // בדיקת קיום הטבלה
  const tableExists = await checkTableExists();
  
  if (tableExists) {
    // בדיקת הטבלה
    const tableWorks = await testTableAfterCreation();
    
    log('');
    log('📋 סיכום:', 'bright');
    log('- טבלה קיימת: ✅');
    log('- טבלה עובדת: ' + (tableWorks ? '✅' : '❌'));
    log('');
    
    if (tableWorks) {
      logSuccess('הטבלה קיימת ועובדת!');
      log('');
      log('🌐 המערכת מוכנה לשימוש:', 'bright');
      log('1. גש ל: http://localhost:3000');
      log('2. התחבר עם הפרטים שלך');
      log('3. המערכת תתחיל סנכרון אוטומטי');
    } else {
      logError('הטבלה קיימת אבל יש בעיות');
    }
  } else {
    log('');
    logWarning('הטבלה לא קיימת');
    await createTableManually();
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
  checkTableExists,
  createTableManually,
  testTableAfterCreation
}; 