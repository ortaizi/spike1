/**
 * סקריפט לבדיקת חיבור לדאטהבייס
 * =================================
 * 
 * סקריפט זה בודק את החיבור לדאטהבייס ומוסיף קורס לדוגמה
 */

import { createClient } from '@supabase/supabase-js';

async function testDatabaseConnection() {
  try {
    console.log('🔗 בודק חיבור לדאטהבייס...\n');

    // חיבור ל-Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ חסרים משתני סביבה:');
      console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
      console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
      return;
    }

    console.log('✅ משתני סביבה קיימים');
    console.log(`   - Supabase URL: ${supabaseUrl}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // בדיקת חיבור
    console.log('\n🔍 בודק חיבור לדאטהבייס...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('❌ שגיאה בבדיקת טבלאות:', tablesError);
      return;
    }

    console.log('✅ חיבור לדאטהבייס עובד');
    console.log(`📊 נמצאו ${tables?.length || 0} טבלאות`);

    // בדיקת טבלת courses
    console.log('\n📋 בודק טבלת courses...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);

    if (coursesError) {
      console.log('❌ שגיאה בבדיקת טבלת courses:', coursesError);
      return;
    }

    console.log(`✅ טבלת courses קיימת`);
    console.log(`📊 נמצאו ${courses?.length || 0} קורסים בטבלה`);

    // הוספת קורס לדוגמה
    console.log('\n➕ מוסיף קורס לדוגמה...');
    
    const testCourse = {
      id: 'test_course_' + Date.now(),
      code: 'TEST101',
      name: 'קורס בדיקה',
      description: 'קורס לבדיקת החיבור לדאטהבייס',
      credits: 3,
      semester: '2024A',
      academicyear: 2024,
      faculty: 'בדיקה',
      department: 'בדיקה',
      instructor: 'מערכת הבדיקה',
      isactive: true,
      moodleid: 'test_' + Date.now(),
      moodleurl: 'https://moodle.bgu.ac.il/course/view.php?id=test',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    const { data: insertedCourse, error: insertError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select();

    if (insertError) {
      console.log('❌ שגיאה בהוספת קורס:', insertError);
      return;
    }

    console.log('✅ קורס נוסף בהצלחה!');
    console.log(`📋 פרטי הקורס:`);
    console.log(`   - מזהה: ${insertedCourse[0].id}`);
    console.log(`   - שם: ${insertedCourse[0].name}`);
    console.log(`   - קוד: ${insertedCourse[0].code}`);

    // בדיקת טבלת course_enrollments
    console.log('\n📋 בודק טבלת course_enrollments...');
    
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('*')
      .limit(5);

    if (enrollmentsError) {
      console.log('❌ שגיאה בבדיקת טבלת course_enrollments:', enrollmentsError);
      return;
    }

    console.log(`✅ טבלת course_enrollments קיימת`);
    console.log(`📊 נמצאו ${enrollments?.length || 0} הרשמות בטבלה`);

    // הוספת הרשמה לדוגמה
    console.log('\n➕ מוסיף הרשמה לדוגמה...');
    
    const testEnrollment = {
      userid: 'test_user_' + Date.now(),
      courseid: insertedCourse[0].id,
      status: 'ACTIVE',
      enrolledat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    const { data: insertedEnrollment, error: enrollmentInsertError } = await supabase
      .from('course_enrollments')
      .insert(testEnrollment)
      .select();

    if (enrollmentInsertError) {
      console.log('❌ שגיאה בהוספת הרשמה:', enrollmentInsertError);
      return;
    }

    console.log('✅ הרשמה נוספה בהצלחה!');
    console.log(`📋 פרטי ההרשמה:`);
    console.log(`   - משתמש: ${insertedEnrollment[0].userid}`);
    console.log(`   - קורס: ${insertedEnrollment[0].courseid}`);
    console.log(`   - סטטוס: ${insertedEnrollment[0].status}`);

    console.log('\n✅ בדיקת דאטהבייס הושלמה בהצלחה!');

  } catch (error) {
    console.error('❌ שגיאה בבדיקת דאטהבייס:', error);
  }
}

// הרצת הבדיקה
testDatabaseConnection()
  .then(() => {
    console.log('\n🏁 בדיקת דאטהבייס הושלמה');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 שגיאה קריטית:', error);
    process.exit(1);
  }); 