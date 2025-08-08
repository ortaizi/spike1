import { NextRequest, NextResponse } from 'next/server';
import { courseCollector } from '../../../lib/data-collectors/course-collector';
import { MoodleCredentials } from '../../../lib/moodle-connector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, university } = body;

    if (!username || !password || !university) {
      return NextResponse.json(
        { error: 'נדרשים username, password ו-university' },
        { status: 400 }
      );
    }

    const credentials: MoodleCredentials = {
      username,
      password,
      university: university as 'bgu' | 'technion' | 'huji' | 'tau'
    };

    console.log(`🧪 מתחיל בדיקת איסוף קורסים עבור ${university}...`);

    // בדיקת איסוף קורסים
    const result = await courseCollector.testCourseCollection(credentials);

    if (result.success) {
      console.log(`✅ בדיקת איסוף קורסים הושלמה בהצלחה`);
      
      return NextResponse.json({
        success: true,
        message: 'בדיקת איסוף קורסים הושלמה בהצלחה',
        data: {
          totalCourses: result.totalCourses,
          courses: result.courses?.slice(0, 5), // מחזיר רק 5 קורסים לדוגמה
          collectionTime: result.collectionTime
        }
      });
    } else {
      console.log(`❌ בדיקת איסוף קורסים נכשלה: ${result.error}`);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'בדיקת איסוף קורסים נכשלה'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('שגיאה בבדיקת איסוף קורסים:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
} 