/**
 * API endpoint לשמירת קורסים בדאטהבייס
 * ======================================
 * 
 * endpoint זה שומר קורסים בטבלת courses ויוצר הרשמות בטבלת course_enrollments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courses, userId } = body;

    // וידוא שכל הפרטים הנדרשים קיימים
    if (!courses || !Array.isArray(courses) || !userId) {
      return NextResponse.json({
        success: false,
        error: 'חסרים פרטים נדרשים: courses (array) ו-userId'
      }, { status: 400 });
    }

    console.log(`💾 מתחיל שמירת ${courses.length} קורסים בדאטהבייס...`);

    let savedCourses = 0;
    let savedEnrollments = 0;
    const savedCourseData = [];

    // שמירת כל קורס
    for (const course of courses) {
      try {
        // שמירת קורס בטבלת courses
        const { error: courseError } = await supabase
          .from('courses')
          .upsert({
            id: course.id,
            code: course.code,
            name: course.name,
            description: course.description,
            credits: course.credits,
            semester: course.semester,
            academicyear: course.year,
            faculty: course.faculty,
            department: course.department,
            instructor: course.instructor,
            isactive: course.isActive,
            moodle_course_id: course.moodleId,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (courseError) {
          console.error(`❌ שגיאה בשמירת קורס ${course.name}:`, courseError);
          continue;
        }

        // יצירת הרשמה לקורס בטבלת course_enrollments
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .upsert({
            userid: userId,
            courseid: course.id,
            status: 'ACTIVE',
            enrolledat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }, {
            onConflict: 'userid,courseid'
          });

        if (enrollmentError) {
          console.error(`❌ שגיאה בהרשמה לקורס ${course.name}:`, enrollmentError);
        } else {
          savedEnrollments++;
        }

        savedCourses++;
        savedCourseData.push({
          id: course.id,
          name: course.name,
          code: course.code,
          instructor: course.instructor
        });

        console.log(`✅ נשמר קורס: ${course.name} (${course.code})`);

      } catch (error) {
        console.error(`❌ שגיאה בעיבוד קורס ${course.name}:`, error);
        continue;
      }
    }

    console.log(`✅ שמירת קורסים הושלמה בהצלחה: ${savedCourses} קורסים, ${savedEnrollments} הרשמות`);

    return NextResponse.json({
      success: true,
      message: 'קורסים נשמרו בהצלחה בדאטהבייס',
      data: {
        savedCourses,
        savedEnrollments,
        courses: savedCourseData
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
    message: 'API endpoint לשמירת קורסים בדאטהבייס',
    usage: {
      method: 'POST',
      body: {
        courses: 'array - מערך של קורסים',
        userId: 'string - מזהה המשתמש'
      }
    },
    example: {
      courses: [
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
          isActive: true
        }
      ],
      userId: 'user_123'
    }
  });
} 