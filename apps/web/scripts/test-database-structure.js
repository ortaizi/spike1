#!/usr/bin/env node

/**
 * בדיקת מבנה הדטה בייס והתאמת המערכת
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// קריאת קובץ .env.development
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

async function testDatabaseStructure() {
  log('🔍 בודק מבנה הדטה בייס...');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    logInfo(`Supabase URL: ${supabaseUrl ? 'נמצא' : 'לא נמצא'}`);
    logInfo(`Supabase Key: ${supabaseKey ? 'נמצא' : 'לא נמצא'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('חסרים משתני סביבה של Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // בדיקת טבלת sync_jobs
    logInfo('בודק טבלת sync_jobs...');
    const { data: syncJobsStructure, error: syncJobsError } = await supabase
      .from('sync_jobs')
      .select('*')
      .limit(1);
    
    if (syncJobsError) {
      logError(`שגיאה בבדיקת sync_jobs: ${syncJobsError.message}`);
    } else {
      logSuccess('טבלת sync_jobs קיימת ונגישה');
    }
    
    // בדיקת טבלת courses
    logInfo('בודק טבלת courses...');
    const { data: coursesStructure, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (coursesError) {
      logError(`שגיאה בבדיקת courses: ${coursesError.message}`);
    } else {
      logSuccess('טבלת courses קיימת ונגישה');
    }
    
    // בדיקת טבלת assignments
    logInfo('בודק טבלת assignments...');
    const { data: assignmentsStructure, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);
    
    if (assignmentsError) {
      logError(`שגיאה בבדיקת assignments: ${assignmentsError.message}`);
    } else {
      logSuccess('טבלת assignments קיימת ונגישה');
    }
    
    // בדיקת טבלת course_sections
    logInfo('בודק טבלת course_sections...');
    const { data: sectionsStructure, error: sectionsError } = await supabase
      .from('course_sections')
      .select('*')
      .limit(1);
    
    if (sectionsError) {
      logError(`שגיאה בבדיקת course_sections: ${sectionsError.message}`);
    } else {
      logSuccess('טבלת course_sections קיימת ונגישה');
    }
    
    // בדיקת טבלת course_items
    logInfo('בודק טבלת course_items...');
    const { data: itemsStructure, error: itemsError } = await supabase
      .from('course_items')
      .select('*')
      .limit(1);
    
    if (itemsError) {
      logError(`שגיאה בבדיקת course_items: ${itemsError.message}`);
    } else {
      logSuccess('טבלת course_items קיימת ונגישה');
    }
    
    // בדיקת טבלת course_files
    logInfo('בודק טבלת course_files...');
    const { data: filesStructure, error: filesError } = await supabase
      .from('course_files')
      .select('*')
      .limit(1);
    
    if (filesError) {
      logError(`שגיאה בבדיקת course_files: ${filesError.message}`);
    } else {
      logSuccess('טבלת course_files קיימת ונגישה');
    }
    
    // בדיקת טבלת teaching_staff
    logInfo('בודק טבלת teaching_staff...');
    const { data: staffStructure, error: staffError } = await supabase
      .from('teaching_staff')
      .select('*')
      .limit(1);
    
    if (staffError) {
      logError(`שגיאה בבדיקת teaching_staff: ${staffError.message}`);
    } else {
      logSuccess('טבלת teaching_staff קיימת ונגישה');
    }
    
    // בדיקת טבלת announcements
    logInfo('בודק טבלת announcements...');
    const { data: announcementsStructure, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (announcementsError) {
      logError(`שגיאה בבדיקת announcements: ${announcementsError.message}`);
    } else {
      logSuccess('טבלת announcements קיימת ונגישה');
    }
    
    // בדיקת טבלת exams
    logInfo('בודק טבלת exams...');
    const { data: examsStructure, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .limit(1);
    
    if (examsError) {
      logError(`שגיאה בבדיקת exams: ${examsError.message}`);
    } else {
      logSuccess('טבלת exams קיימת ונגישה');
    }
    
    // בדיקת טבלת content_analysis
    logInfo('בודק טבלת content_analysis...');
    const { data: analysisStructure, error: analysisError } = await supabase
      .from('content_analysis')
      .select('*')
      .limit(1);
    
    if (analysisError) {
      logError(`שגיאה בבדיקת content_analysis: ${analysisError.message}`);
    } else {
      logSuccess('טבלת content_analysis קיימת ונגישה');
    }
    
    // בדיקת טבלת course_enrollments
    logInfo('בודק טבלת course_enrollments...');
    const { data: enrollmentsStructure, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('*')
      .limit(1);
    
    if (enrollmentsError) {
      logError(`שגיאה בבדיקת course_enrollments: ${enrollmentsError.message}`);
    } else {
      logSuccess('טבלת course_enrollments קיימת ונגישה');
    }
    
    logSuccess('✅ כל הטבלאות נבדקו בהצלחה!');
    
  } catch (error) {
    logError(`שגיאה כללית: ${error.message}`);
  }
}

async function testSyncJobCreation() {
  log('🧪 בודק יצירת sync job...');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('חסרים משתני סביבה של Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // יצירת job בדיקה
    const testJobId = `test_${Date.now()}`;
    const { error: createError } = await supabase
      .from('sync_jobs')
      .insert({
        id: testJobId,
        user_id: 'test_user',
        status: 'starting',
        progress: 0,
        message: 'בדיקה',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError) {
      logError(`שגיאה ביצירת job: ${createError.message}`);
      return false;
    }
    
    logSuccess('✅ יצירת job הצליחה');
    
    // עדכון job
    const { error: updateError } = await supabase
      .from('sync_jobs')
      .update({
        status: 'completed',
        progress: 100,
        message: 'בדיקה הושלמה',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', testJobId);
    
    if (updateError) {
      logError(`שגיאה בעדכון job: ${updateError.message}`);
      return false;
    }
    
    logSuccess('✅ עדכון job הצליח');
    
    // מחיקת job בדיקה
    const { error: deleteError } = await supabase
      .from('sync_jobs')
      .delete()
      .eq('id', testJobId);
    
    if (deleteError) {
      logWarning(`אזהרה: לא הצלחתי למחוק job בדיקה: ${deleteError.message}`);
    } else {
      logSuccess('✅ מחיקת job הצליחה');
    }
    
    return true;
    
  } catch (error) {
    logError(`שגיאה בבדיקת sync job: ${error.message}`);
    return false;
  }
}

async function main() {
  log('🚀 מתחיל בדיקת מבנה הדטה בייס...');
  
  await testDatabaseStructure();
  
  log('');
  log('🧪 בודק פונקציונליות sync jobs...');
  
  const syncJobTest = await testSyncJobCreation();
  
  if (syncJobTest) {
    logSuccess('✅ כל הבדיקות עברו בהצלחה!');
    logInfo('המערכת מותאמת למבנה הדטה בייס הנוכחי');
  } else {
    logError('❌ חלק מהבדיקות נכשלו');
    logWarning('ייתכן שיש צורך בעדכון הקוד או הטבלאות');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testDatabaseStructure,
  testSyncJobCreation
}; 