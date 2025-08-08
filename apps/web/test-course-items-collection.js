/**
 * סקריפט בדיקה לאיסוף פריטי קורס
 * =================================
 * 
 * סקריפט זה מאפשר בדיקה של איסוף פריטים מקורס ספציפי במודל
 */

const API_BASE_URL = 'http://localhost:3000/api';

async function testCourseItemsCollection() {
  try {
    console.log('🧪 מתחיל בדיקת איסוף פריטי קורס...\n');

    // פרטי התחברות למודל (יש להחליף בפרטים אמיתיים)
    const testData = {
      username: process.env.MOODLE_USERNAME || 'your_username',
      password: process.env.MOODLE_PASSWORD || 'your_password',
      university: 'bgu',
      courseId: 'test_course_123',
      courseUrl: 'https://moodle.bgu.ac.il/course/view.php?id=123' // יש להחליף ב-URL אמיתי
    };

    console.log('📋 פרטי הבדיקה:');
    console.log(`   - משתמש: ${testData.username}`);
    console.log(`   - אוניברסיטה: ${testData.university}`);
    console.log(`   - מזהה קורס: ${testData.courseId}`);
    console.log(`   - URL קורס: ${testData.courseUrl}\n`);

    // קריאה ל-API
    console.log('📡 שולח בקשה ל-API...');
    
    const response = await fetch(`${API_BASE_URL}/test-course-items-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('📊 תוצאות הבדיקה:');
    console.log(`   - סטטוס: ${response.status}`);
    console.log(`   - הצלחה: ${result.success}`);

    if (result.success) {
      console.log('\n✅ בדיקה הושלמה בהצלחה!');
      console.log(`   - סה"כ פריטים: ${result.data.totalItems}`);
      console.log(`   - סה"כ sections: ${result.data.totalSections}`);
      console.log(`   - סה"כ צוות הוראה: ${result.data.totalStaff}`);
      console.log(`   - זמן איסוף: ${result.data.collectionTime}`);

      if (result.data.sections && result.data.sections.length > 0) {
        console.log('\n📋 Sections שנמצאו:');
        result.data.sections.forEach((section, index) => {
          console.log(`   ${index + 1}. ${section.title}`);
        });
      }

      if (result.data.items && result.data.items.length > 0) {
        console.log('\n📄 פריטים שנמצאו:');
        result.data.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title} (${item.type})`);
        });
      }

      if (result.data.teachingStaff && result.data.teachingStaff.length > 0) {
        console.log('\n👥 צוות הוראה שנמצא:');
        result.data.teachingStaff.forEach((staff, index) => {
          console.log(`   ${index + 1}. ${staff.name} (${staff.role})`);
        });
      }

    } else {
      console.log('\n❌ בדיקה נכשלה!');
      console.log(`   - שגיאה: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ שגיאה בבדיקה:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 טיפ: וודא שהשרת רץ על http://localhost:3000');
    }
  }
}

// הרצת הבדיקה
if (require.main === module) {
  testCourseItemsCollection()
    .then(() => {
      console.log('\n🏁 בדיקה הושלמה');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 שגיאה קריטית:', error);
      process.exit(1);
    });
}

module.exports = { testCourseItemsCollection }; 