/**
 * בדיקה אמיתית של איסוף קורסים
 */

// שימוש ב-fetch המובנה של Node.js

async function testRealCourseCollection() {
  console.log('🧪 מתחיל בדיקה אמיתית של איסוף קורסים...');
  
  try {
    // פרטי התחברות אמיתיים של המשתמש הקיים
    const credentials = {
      username: 'ortaiz',
      password: 'your_password_here', // יש להחליף בסיסמה אמיתית
      university: 'bgu'
    };

    console.log(`📚 בודק איסוף קורסים עבור ${credentials.university}...`);
    console.log(`👤 משתמש: ${credentials.username}`);

    // בדיקה דרך API endpoint
    const response = await fetch('http://localhost:3001/api/test-course-collection-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      console.log(`❌ שגיאה בשרת: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`פרטי שגיאה: ${errorText}`);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ בדיקת איסוף קורסים הושלמה בהצלחה!');
      console.log(`📊 נמצאו ${result.data.totalCourses} קורסים`);
      
      if (result.data.courses && result.data.courses.length > 0) {
        console.log('📋 קורסים שנמצאו:');
        result.data.courses.forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.name} (${course.code || 'ללא קוד'})`);
          console.log(`     מרצה: ${course.instructor || 'לא צוין'}`);
          console.log(`     פקולטה: ${course.faculty || 'לא צוין'}`);
          console.log(`     סמסטר: ${course.semester || 'לא צוין'}`);
          console.log(`     URL: ${course.moodleUrl || 'לא צוין'}`);
          console.log('');
        });
      }
      
      console.log(`⏰ זמן איסוף: ${result.data.collectionTime}`);
      
      // בדיקה שהקורסים נשמרו בדאטהבייס
      console.log('\n💾 בודק שמירה בדאטהבייס...');
      await checkDatabaseAfterCollection();
      
    } else {
      console.log('❌ בדיקת איסוף קורסים נכשלה');
      console.log(`שגיאה: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ שגיאה בבדיקת איסוף קורסים:', error);
  }
}

async function checkDatabaseAfterCollection() {
  try {
    // בדיקה שהקורסים נשמרו בדאטהבייס
    const response = await fetch('https://fnizmtpiyszmmccorscc.supabase.co/rest/v1/courses?select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuaXptdHBpeXN6bW1jY29yc2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAwMzE1MCwiZXhwIjoyMDY5NTc5MTUwfQ.GcwMbEGiFJmmyuoKLYRb0tJU7XK0Xdw6Rbp6WtbtynU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuaXptdHBpeXN6bW1jY29yc2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAwMzE1MCwiZXhwIjoyMDY5NTc5MTUwfQ.GcwMbEGiFJmmyuoKLYRb0tJU7XK0Xdw6Rbp6WtbtynU'
      }
    });

    if (response.ok) {
      const courses = await response.json();
      console.log(`✅ נמצאו ${courses.length} קורסים בדאטהבייס`);
      
      if (courses.length > 0) {
        console.log('📋 קורסים בדאטהבייס:');
        courses.forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.name} (${course.code})`);
        });
      }
    } else {
      console.log('❌ שגיאה בבדיקת הדאטהבייס');
    }
  } catch (error) {
    console.error('❌ שגיאה בבדיקת הדאטהבייס:', error);
  }
}

// הרצת הבדיקה
testRealCourseCollection()
  .then(() => {
    console.log('\n🏁 בדיקה הושלמה');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 שגיאה בבדיקה:', error);
    process.exit(1);
  }); 