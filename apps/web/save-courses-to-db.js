/**
 * סקריפט לשמירת קורסים בדאטהבייס
 * =================================
 * 
 * סקריפט זה אוסף קורסים מהמודל ושומר אותם בדאטהבייס
 */

async function saveCoursesToDatabase() {
  try {
    console.log('💾 מתחיל שמירת קורסים בדאטהבייס...\n');

    // פרטי התחברות לבדיקה
    const testData = {
      username: process.env.MOODLE_USERNAME || 'test_user',
      password: process.env.MOODLE_PASSWORD || 'test_password',
      university: 'bgu'
    };

    console.log('📋 פרטי הבדיקה:');
    console.log(`   - משתמש: ${testData.username}`);
    console.log(`   - אוניברסיטה: ${testData.university}\n`);

    // קריאה ל-API לאיסוף קורסים
    console.log('📡 אוסף קורסים מהמודל...');
    
    const response = await fetch('http://localhost:3000/api/test-course-collection-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      console.log(`❌ שגיאה בשרת: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`פרטי שגיאה: ${errorText}`);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ איסוף קורסים הושלם בהצלחה!');
      console.log(`📊 נמצאו ${result.data.totalCourses} קורסים`);
      
      // שמירת קורסים בדאטהבייס
      console.log('\n💾 שומר קורסים בדאטהבייס...');
      
      const saveResponse = await fetch('http://localhost:3000/api/save-courses-to-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courses: result.data.courses,
          userId: 'test_user_123'
        })
      });

      if (!saveResponse.ok) {
        console.log(`❌ שגיאה בשמירה: ${saveResponse.status} ${saveResponse.statusText}`);
        const errorText = await saveResponse.text();
        console.log(`פרטי שגיאה: ${errorText}`);
        return;
      }

      const saveResult = await saveResponse.json();

      if (saveResult.success) {
        console.log('✅ קורסים נשמרו בהצלחה בדאטהבייס!');
        console.log(`📊 נשמרו ${saveResult.data.savedCourses} קורסים`);
        console.log(`📊 נוצרו ${saveResult.data.savedEnrollments} הרשמות`);
        
        if (saveResult.data.courses) {
          console.log('\n📋 קורסים שנשמרו:');
          saveResult.data.courses.forEach((course, index) => {
            console.log(`   ${index + 1}. ${course.name} (${course.code || 'ללא קוד'})`);
          });
        }
      } else {
        console.log('❌ שגיאה בשמירת קורסים בדאטהבייס');
        console.log(`שגיאה: ${saveResult.error}`);
      }
      
    } else {
      console.log('❌ איסוף קורסים נכשלה');
      console.log(`שגיאה: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ שגיאה בבדיקה:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 טיפ: וודא שהשרת רץ על http://localhost:3000');
    }
  }
}

// הרצת הבדיקה
if (require.main === module) {
  saveCoursesToDatabase()
    .then(() => {
      console.log('\n🏁 שמירת קורסים הושלמה');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 שגיאה קריטית:', error);
      process.exit(1);
    });
}

module.exports = { saveCoursesToDatabase }; 