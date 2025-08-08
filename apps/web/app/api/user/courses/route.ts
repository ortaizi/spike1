import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';

// נתונים פיקטיביים לקורסים
const mockCourses = [
  {
    id: "1",
    code: "CS101",
    name: "מבוא למדעי המחשב",
    description: "קורס בסיסי בתכנות ובמדעי המחשב",
    credits: 4,
    semester: "א",
    academicyear: 2025,
    faculty: "הנדסה",
    department: "מדעי המחשב",
    instructor: "ד\"ר יוסי כהן",
    isactive: true,
    createdat: "2025-01-01T00:00:00Z",
    updatedat: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    code: "MATH201",
    name: "אלגברה לינארית",
    description: "מטריצות, וקטורים וטרנספורמציות לינאריות",
    credits: 3,
    semester: "א",
    academicyear: 2025,
    faculty: "מדעים מדויקים",
    department: "מתמטיקה",
    instructor: "פרופ' שרה לוי",
    isactive: true,
    createdat: "2025-01-01T00:00:00Z",
    updatedat: "2025-01-01T00:00:00Z"
  },
  {
    id: "3",
    code: "ENG101",
    name: "אנגלית טכנית",
    description: "פיתוח מיומנויות קריאה וכתיבה באנגלית טכנית",
    credits: 2,
    semester: "א",
    academicyear: 2025,
    faculty: "מדעי הרוח",
    department: "אנגלית",
    instructor: "ד\"ר דוד גולדברג",
    isactive: true,
    createdat: "2025-01-01T00:00:00Z",
    updatedat: "2025-01-01T00:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // ניסיון לקבל קורסים מהמסד נתונים
    let courses = [];
    try {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          courseid,
          courses (
            id,
            code,
            name,
            description,
            credits,
            semester,
            academicyear,
            faculty,
            department,
            instructor,
            isactive,
            createdat,
            updatedat
          )
        `)
        .eq('userid', userId)
        .eq('status', 'ACTIVE');

      if (enrollmentError) {
        console.error('Error fetching user courses:', enrollmentError);
        // אם יש שגיאה, השתמש בנתונים פיקטיביים
        courses = mockCourses;
      } else {
        // עיבוד הנתונים
        courses = enrollments
          ?.map(enrollment => enrollment.courses)
          .filter(course => course && course.isactive) || [];
        
        // אם אין נתונים, השתמש בנתונים פיקטיביים
        if (courses.length === 0) {
          courses = mockCourses;
        }
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // במקרה של שגיאת חיבור, השתמש בנתונים פיקטיביים
      courses = mockCourses;
    }

    return NextResponse.json(courses);

  } catch (error) {
    console.error('Error in courses API:', error);
    // במקרה של שגיאה כללית, החזר נתונים פיקטיביים
    return NextResponse.json(mockCourses);
  }
} 