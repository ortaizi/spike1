/**
 * API endpoint לבדיקת איסוף פריטי קורס
 * ======================================
 * 
 * endpoint זה מאפשר בדיקה של איסוף פריטים מקורס ספציפי במודל
 */

import { NextRequest, NextResponse } from 'next/server';
import { CourseItemsCollector } from '@/lib/data-collectors/course-items-collector.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, university, courseId, courseUrl } = body;

    // וידוא שכל הפרטים הנדרשים קיימים
    if (!username || !password || !university || !courseId || !courseUrl) {
      return NextResponse.json({
        success: false,
        error: 'חסרים פרטים נדרשים: username, password, university, courseId, courseUrl'
      }, { status: 400 });
    }

    console.log(`🧪 מתחיל בדיקת איסוף פריטים מקורס ${courseId}...`);

    // יצירת מופע של CourseItemsCollector
    const collector = new CourseItemsCollector();

    // הגדרת פרטי התחברות
    const credentials = {
      username,
      password,
      university
    };

    // הרצת בדיקת איסוף פריטים
    const result = await collector.testCourseItemsCollection(
      credentials,
      courseId,
      courseUrl
    );

    if (result.success) {
      console.log(`✅ בדיקת איסוף פריטים הושלמה בהצלחה`);
      
      return NextResponse.json({
        success: true,
        message: 'בדיקת איסוף פריטים הושלמה בהצלחה',
        data: {
          courseId: result.courseId,
          totalItems: result.totalItems,
          totalSections: result.totalSections,
          totalStaff: result.totalStaff,
          collectionTime: result.collectionTime,
          sections: result.sections?.slice(0, 5), // רק 5 הראשונים לדוגמה
          items: result.items?.slice(0, 10), // רק 10 הראשונים לדוגמה
          teachingStaff: result.teachingStaff?.slice(0, 5) // רק 5 הראשונים לדוגמה
        }
      });
    } else {
      console.log(`❌ בדיקת איסוף פריטים נכשלה: ${result.error}`);
      
      return NextResponse.json({
        success: false,
        error: result.error || 'שגיאה לא ידועה באיסוף פריטים'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ שגיאה ב-API endpoint:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API endpoint לבדיקת איסוף פריטי קורס',
    usage: {
      method: 'POST',
      body: {
        username: 'string - שם משתמש במודל',
        password: 'string - סיסמה במודל',
        university: 'string - שם האוניברסיטה (bgu)',
        courseId: 'string - מזהה הקורס',
        courseUrl: 'string - כתובת URL של הקורס במודל'
      }
    },
    example: {
      username: 'your_username',
      password: 'your_password',
      university: 'bgu',
      courseId: 'course_123',
      courseUrl: 'https://moodle.bgu.ac.il/course/view.php?id=123'
    }
  });
} 