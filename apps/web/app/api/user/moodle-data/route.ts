import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/auth-provider';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // Check if Supabase is available (not using placeholder values)
    const supabaseUrl = process.env['SUPABASE_URL'] || '';
    const supabaseKey = process.env['SUPABASE_ANON_KEY'] || '';

    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Using mock Moodle data (Supabase not configured)');

      // Return mock data
      const mockMoodleData = {
        courses: [
          {
            id: '1',
            name: 'מבוא למדעי המחשב',
            code: 'CS101',
            semester: 'א',
            grade: 85,
            assignments: [
              {
                id: 1,
                name: 'תרגיל 1 - משתנים ולולאות',
                grade: 90,
                dueDate: '2024-11-15',
              },
              {
                id: 2,
                name: 'תרגיל 2 - פונקציות ומערכים',
                grade: 85,
                dueDate: '2024-11-30',
              },
            ],
          },
          {
            id: '2',
            name: 'אלגברה לינארית',
            code: 'MATH101',
            semester: 'א',
            grade: 78,
            assignments: [
              {
                id: 3,
                name: 'תרגיל 1 - מטריצות',
                grade: 80,
                dueDate: '2024-11-20',
              },
            ],
          },
          {
            id: '3',
            name: 'פיזיקה כללית',
            code: 'PHYS101',
            semester: 'א',
            grade: 92,
            assignments: [
              {
                id: 4,
                name: 'תרגיל 1 - מכניקה',
                grade: 95,
                dueDate: '2024-11-25',
              },
            ],
          },
        ],
        profile: {
          studentId: session.user.studentId || '123456789',
          fullName: session.user.name || 'משתמש דוגמה',
          email: session.user.email || 'user@example.com',
          department: 'מדעי המחשב',
          year: 1,
        },
      };

      return NextResponse.json({
        success: true,
        data: mockMoodleData,
      });
    }

    // Get user data from database
    const { supabase } = await import('../../../../lib/db');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // Get Moodle data from user preferences
    const preferences = user.preferences as any;
    const moodleData = preferences?.moodleData;

    if (!moodleData) {
      return NextResponse.json({ error: 'נתוני מודל לא נמצאו' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: moodleData,
    });
  } catch (error) {
    console.error('Error fetching Moodle data:', error);
    return NextResponse.json({ error: 'שגיאה בקבלת נתוני מודל' }, { status: 500 });
  }
}
