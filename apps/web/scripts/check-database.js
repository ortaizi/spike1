/**
 * בדיקת הדאטהבייס
 */

const { createClient } = require('@supabase/supabase-js');

// חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 בודק את הדאטהבייס...');
  
  try {
    // בדיקת טבלת courses
    console.log('\n📚 בודק טבלת courses...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);
    
    if (coursesError) {
      console.log('❌ שגיאה בטבלת courses:', coursesError);
    } else {
      console.log(`✅ טבלת courses קיימת, ${courses.length} קורסים נמצאו`);
      if (courses.length > 0) {
        courses.forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.name} (${course.code})`);
        });
      }
    }

    // בדיקת טבלת course_enrollments
    console.log('\n👥 בודק טבלת course_enrollments...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('*')
      .limit(5);
    
    if (enrollmentsError) {
      console.log('❌ שגיאה בטבלת course_enrollments:', enrollmentsError);
    } else {
      console.log(`✅ טבלת course_enrollments קיימת, ${enrollments.length} הרשמות נמצאו`);
    }

    // בדיקת טבלת users
    console.log('\n👤 בודק טבלת users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ שגיאה בטבלת users:', usersError);
    } else {
      console.log(`✅ טבלת users קיימת, ${users.length} משתמשים נמצאו`);
    }

    // בדיקת מבנה הטבלאות
    console.log('\n🏗️ בודק מבנה הטבלאות...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info');
    
    if (tablesError) {
      console.log('❌ שגיאה בבדיקת מבנה הטבלאות:', tablesError);
    } else {
      console.log('✅ מבנה הטבלאות תקין');
    }

  } catch (error) {
    console.error('❌ שגיאה כללית:', error);
  }
}

// הרצת הבדיקה
checkDatabase()
  .then(() => {
    console.log('\n🏁 בדיקת הדאטהבייס הושלמה');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 שגיאה בבדיקה:', error);
    process.exit(1);
  }); 