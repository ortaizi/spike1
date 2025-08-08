/**
 * בדיקה פשוטה של איסוף קורסים
 */

async function testCourseCollection() {
  console.log('🧪 מתחיל בדיקת איסוף קורסים...');
  
  try {
    // פרטי התחברות לבדיקה
    const credentials = {
      username: process.env.TEST_MOODLE_USERNAME || 'test_user',
      password: process.env.TEST_MOODLE_PASSWORD || 'test_password',
      university: process.env.TEST_MOODLE_UNIVERSITY || 'bgu'
    };

    console.log(`📚 בודק איסוף קורסים עבור ${credentials.university}...`);

    // בדיקה דרך API endpoint
    const response = await fetch('http://localhost:3000/api/test-course-collection-simple', {
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
        console.log('📋 דוגמה לקורסים שנמצאו:');
        result.data.courses.forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.name} (${course.code || 'ללא קוד'})`);
        });
      }
      
      console.log(`⏰ זמן איסוף: ${result.data.collectionTime}`);
    } else {
      console.log('❌ בדיקת איסוף קורסים נכשלה');
      console.log(`שגיאה: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ שגיאה בבדיקת איסוף קורסים:', error);
  }
}

// הרצת הבדיקה
testCourseCollection()
  .then(() => {
    console.log('🏁 בדיקה הושלמה');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 שגיאה בבדיקה:', error);
    process.exit(1);
  }); 