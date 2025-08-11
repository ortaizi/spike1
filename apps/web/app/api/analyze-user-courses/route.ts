import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/server-auth';
import { env } from "../../../lib/env"

interface AnalysisRequest {
  user_id: string;
  course_data: any;
  force_reanalysis: boolean;
}

interface AnalysisResponse {
  course_id: string;
  course_name: string;
  status: string;
  message: string;
  analysis_id?: string;
  estimated_time?: number;
}

export async function POST(request: NextRequest) {
  try {
    // בדיקת אימות
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const body: AnalysisRequest = await request.json();
    const { user_id, course_data, force_reanalysis } = body;

    // וידוא שהמשתמש מנתח את הקורסים שלו
    if (session.user.id !== user_id) {
      return NextResponse.json(
        { error: 'לא מורשה לנתח קורסים של משתמש אחר' },
        { status: 403 }
      );
    }

    // קריאה למערכת הניתוח
    const analyzerResponse = await fetch(`${env.COURSE_ANALYZER_API_URL || 'http://localhost:8000'}/analyze-user-courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        course_data,
        force_reanalysis
      })
    });

    if (!analyzerResponse.ok) {
      const errorData = await analyzerResponse.json();
      return NextResponse.json(
        { error: errorData.detail || 'שגיאה בניתוח קורסים' },
        { status: analyzerResponse.status }
      );
    }

    const analysisData: AnalysisResponse = await analyzerResponse.json();

    return NextResponse.json(analysisData);

  } catch (error) {
    console.error('שגיאה בניתוח קורסים:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // בדיקת אימות
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id || session.user.id !== user_id) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 403 }
      );
    }

    // קריאה למערכת הניתוח לקבלת קורסים של המשתמש
    const analyzerResponse = await fetch(`${env.COURSE_ANALYZER_API_URL || 'http://localhost:8000'}/user-courses/${user_id}`);

    if (!analyzerResponse.ok) {
      return NextResponse.json(
        { error: 'שגיאה בטעינת קורסים' },
        { status: analyzerResponse.status }
      );
    }

    const coursesData = await analyzerResponse.json();

    return NextResponse.json(coursesData);

  } catch (error) {
    console.error('שגיאה בטעינת קורסים:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
} 