import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';

// נתונים פיקטיביים למטלות
const mockAssignments = [
  {
    id: '1',
    title: 'תרגיל 1 - מבוא למדעי המחשב',
    description: 'תרגילי תכנות בסיסיים ב-Python',
    courseid: '1',
    duedate: '2025-01-15',
    priority: 'HIGH',
    status: 'PENDING',
    weight: 15,
    maxgrade: 100,
    attachments: [],
    createdat: '2025-01-01T00:00:00Z',
    updatedat: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'פרויקט מבני נתונים',
    description: 'יישום עץ בינארי מאוזן',
    courseid: '1',
    duedate: '2025-01-20',
    priority: 'HIGH',
    status: 'PENDING',
    weight: 25,
    maxgrade: 100,
    attachments: [],
    createdat: '2025-01-01T00:00:00Z',
    updatedat: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'בחינת אמצע - אלגברה לינארית',
    description: 'בחינה על מטריצות וטרנספורמציות לינאריות',
    courseid: '2',
    duedate: '2025-01-25',
    priority: 'MEDIUM',
    status: 'PENDING',
    weight: 30,
    maxgrade: 100,
    attachments: [],
    createdat: '2025-01-01T00:00:00Z',
    updatedat: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    title: 'תרגיל 2 - תכנות מונחה עצמים',
    description: 'יצירת מערכת ניהול ספרייה ב-Java',
    courseid: '1',
    duedate: '2025-01-30',
    priority: 'MEDIUM',
    status: 'PENDING',
    weight: 20,
    maxgrade: 100,
    attachments: [],
    createdat: '2025-01-01T00:00:00Z',
    updatedat: '2025-01-01T00:00:00Z',
  },
  {
    id: '5',
    title: 'עבודה סופית - אלגוריתמים',
    description: 'ניתוח סיבוכיות אלגוריתמים',
    courseid: '1',
    duedate: '2024-12-15',
    priority: 'HIGH',
    status: 'PENDING',
    weight: 40,
    maxgrade: 100,
    attachments: [],
    createdat: '2025-01-01T00:00:00Z',
    updatedat: '2025-01-01T00:00:00Z',
  },
  {
    id: '6',
    title: 'תרגיל בית - מבני נתונים',
    description: 'יישום רשימה מקושרת',
    courseid: '1',
    duedate: '2024-12-20',
    priority: 'MEDIUM',
    status: 'PENDING',
    weight: 15,
    maxgrade: 100,
    attachments: [],
    createdat: '2025-01-01T00:00:00Z',
    updatedat: '2025-01-01T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // ניסיון לקבל מטלות מהמסד נתונים
    let assignments = [];
    try {
      const { data: assignmentsData, error: assignmentError } = await supabase
        .from('assignments')
        .select(
          `
          id,
          title,
          description,
          courseid,
          duedate,
          priority,
          status,
          weight,
          maxgrade,
          attachments,
          createdat,
          updatedat,
          courses!inner (
            course_enrollments!inner (
              userid
            )
          )
        `
        )
        .eq('courses.course_enrollments.userid', userId)
        .order('duedate', { ascending: true });

      if (assignmentError) {
        console.error('Error fetching user assignments:', assignmentError);
        // אם יש שגיאה, השתמש בנתונים פיקטיביים
        assignments = mockAssignments;
      } else {
        assignments = assignmentsData || [];

        // אם אין נתונים, השתמש בנתונים פיקטיביים
        if (assignments.length === 0) {
          assignments = mockAssignments;
        }
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // במקרה של שגיאת חיבור, השתמש בנתונים פיקטיביים
      assignments = mockAssignments;
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error in assignments API:', error);
    // במקרה של שגיאה כללית, החזר נתונים פיקטיביים
    return NextResponse.json(mockAssignments);
  }
}
