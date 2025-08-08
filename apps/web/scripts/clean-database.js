#!/usr/bin/env node

/**
 * סקריפט לניקוי הדאטהבייס לקראת אינטגרציה עם Moodle
 * =====================================================
 * 
 * סקריפט זה מנקה את כל הנתונים הקיימים (Mock Data) מהדאטהבייס
 * ומכין אותו לקראת אינטגרציה עם Moodle
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

// הגדרת חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ חסרים משתני סביבה נדרשים');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// רשימת הטבלאות לניקוי
const TABLES_TO_CLEAN = [
  'assignments',
  'announcements', 
  'course_files',
  'teaching_staff',
  'exams',
  'events',
  'event_registrations',
  'tuition',
  'reserves',
  'emails',
  'notifications',
  'course_sections',
  'course_items',
  'progress_tracking',
  'content_analysis',
  'course_enrollments',
  'courses',
  'sync_jobs'
];

/**
 * ניקוי טבלה בודדת
 */
async function cleanTable(tableName) {
  try {
    console.log(`🧹 מנקה טבלה: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // לא למחוק רשומות מערכת
    
    if (error) {
      console.error(`❌ שגיאה בניקוי טבלה ${tableName}:`, error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ טבלה ${tableName} נוקתה בהצלחה`);
    return { success: true, deletedCount: data?.length || 0 };
  } catch (error) {
    console.error(`❌ שגיאה בניקוי טבלה ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * בדיקה שטבלה ריקה
 */
async function verifyTableEmpty(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ שגיאה בבדיקת טבלה ${tableName}:`, error.message);
      return false;
    }
    
    const isEmpty = !data || data.length === 0;
    console.log(`📊 טבלה ${tableName}: ${isEmpty ? 'ריקה' : 'מכילה נתונים'}`);
    return isEmpty;
  } catch (error) {
    console.error(`❌ שגיאה בבדיקת טבלה ${tableName}:`, error.message);
    return false;
  }
}

/**
 * יצירת רשומת ניטור
 */
async function createCleanupLog(tableName, success, deletedCount, errorMessage = null) {
  try {
    // בדיקה אם הטבלה קיימת
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'database_cleanup_log')
      .single();
    
    if (!tableExists) {
      console.log(`📝 טבלת ניטור לא קיימת, דילוג על יצירת רשומת ניטור`);
      return;
    }
    
    const { error } = await supabase
      .from('database_cleanup_log')
      .insert({
        table_name: tableName,
        rows_deleted: deletedCount || 0,
        status: success ? 'success' : 'error',
        error_message: errorMessage
      });
    
    if (error) {
      console.error(`❌ שגיאה ביצירת רשומת ניטור:`, error.message);
    }
  } catch (error) {
    console.log(`📝 דילוג על יצירת רשומת ניטור: ${error.message}`);
  }
}

/**
 * פונקציה ראשית
 */
async function main() {
  console.log('🚀 מתחיל ניקוי הדאטהבייס...');
  console.log('=====================================');
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  // ניקוי כל הטבלאות
  for (const tableName of TABLES_TO_CLEAN) {
    const result = await cleanTable(tableName);
    results.push({ tableName, ...result });
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // יצירת רשומת ניטור
    await createCleanupLog(tableName, result.success, result.deletedCount, result.error);
  }
  
  console.log('\n=====================================');
  console.log('📊 סיכום ניקוי:');
  console.log(`✅ הצלחות: ${successCount}`);
  console.log(`❌ שגיאות: ${errorCount}`);
  
  // בדיקה שכל הטבלאות ריקות
  console.log('\n🔍 בודק שכל הטבלאות ריקות...');
  let allEmpty = true;
  
  for (const tableName of TABLES_TO_CLEAN) {
    const isEmpty = await verifyTableEmpty(tableName);
    if (!isEmpty) {
      allEmpty = false;
    }
  }
  
  console.log('\n=====================================');
  if (allEmpty) {
    console.log('🎉 כל הטבלאות נוקו בהצלחה!');
    console.log('✅ הדאטהבייס מוכן לאינטגרציה עם Moodle');
  } else {
    console.log('⚠️  חלק מהטבלאות עדיין מכילות נתונים');
    console.log('❌ יש לבדוק ולנקות ידנית');
  }
  
  // הדפסת תוצאות מפורטות
  console.log('\n📋 תוצאות מפורטות:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.tableName}: ${result.success ? 'נוקה' : result.error}`);
  });
}

// הרצת הסקריפט
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 ניקוי הושלם');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 שגיאה קריטית:', error);
      process.exit(1);
    });
}

module.exports = { cleanTable, verifyTableEmpty, TABLES_TO_CLEAN }; 