/**
 * API endpoint פשוט לבדיקת איסוף קורסים
 * =======================================
 * 
 * endpoint זה מאפשר בדיקה של איסוף קורסים ללא MoodleConnector
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, university } = body;

    // וידוא שכל הפרטים הנדרשים קיימים
    if (!username || !password || !university) {
      return NextResponse.json({
        success: false,
        error: 'חסרים פרטים נדרשים: username, password, university'
      }, { status: 400 });
    }

    console.log(`🧪 מתחיל בדיקת איסוף קורסים עבור ${university}...`);

    // סימולציה של איסוף קורסים
    const mockCourses = [
      {
        id: 'course_1',
        name: 'מבוא למדעי המחשב',
        code: 'CS101',
        description: 'קורס מבוא למדעי המחשב',
        instructor: 'ד"ר יוסי כהן',
        semester: '2024A',
        year: 2024,
        faculty: 'מדעי המחשב',
        department: 'מדעי המחשב',
        credits: 4,
        moodleId: '123',
        moodleUrl: 'https://moodle.bgu.ac.il/course/view.php?id=123',
        lastModified: new Date(),
        isActive: true
      },
      {
        id: 'course_2',
        name: 'חשבון דיפרנציאלי ואינטגרלי',
        code: 'MATH101',
        description: 'קורס מתמטיקה בסיסי',
        instructor: 'פרופ׳ שרה לוי',
        semester: '2024A',
        year: 2024,
        faculty: 'מתמטיקה',
        department: 'מתמטיקה',
        credits: 5,
        moodleId: '124',
        moodleUrl: 'https://moodle.bgu.ac.il/course/view.php?id=124',
        lastModified: new Date(),
        isActive: true
      },
      {
        id: 'course_3',
        name: 'פיזיקה כללית',
        code: 'PHYS101',
        description: 'קורס פיזיקה בסיסי',
        instructor: 'ד"ר דוד ישראלי',
        semester: '2024A',
        year: 2024,
        faculty: 'פיזיקה',
        department: 'פיזיקה',
        credits: 4,
        moodleId: '125',
        moodleUrl: 'https://moodle.bgu.ac.il/course/view.php?id=125',
        lastModified: new Date(),
        isActive: true
      }
    ];

    console.log(`✅ בדיקת איסוף קורסים הושלמה בהצלחה`);
    
    return NextResponse.json({
      success: true,
      message: 'בדיקת איסוף קורסים הושלמה בהצלחה',
      data: {
        totalCourses: mockCourses.length,
        courses: mockCourses,
        collectionTime: new Date()
      }
    });

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
    message: 'API endpoint פשוט לבדיקת איסוף קורסים',
    usage: {
      method: 'POST',
      body: {
        username: 'string - שם משתמש במודל',
        password: 'string - סיסמה במודל',
        university: 'string - שם האוניברסיטה (bgu)'
      }
    },
    example: {
      username: 'your_username',
      password: 'your_password',
      university: 'bgu'
    }
  });
} 