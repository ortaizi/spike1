import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth/server-auth';
import { env } from '../../../../lib/env';

interface AnalysisStatus {
  analysis_id: string;
  status: string;
  progress: number;
  message: string;
  result?: any;
}

export async function GET(_request: NextRequest, { params }: { params: { analysis_id: string } }) {
  try {
    // בדיקת אימות
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { analysis_id } = params;

    if (!analysis_id) {
      return NextResponse.json({ error: 'מזהה ניתוח חסר' }, { status: 400 });
    }

    // קריאה למערכת הניתוח לבדיקת סטטוס
    const analyzerResponse = await fetch(
      `${env.COURSE_ANALYZER_API_URL || 'http://localhost:8000'}/analysis-status/${analysis_id}`
    );

    if (!analyzerResponse.ok) {
      if (analyzerResponse.status === 404) {
        return NextResponse.json({ error: 'ניתוח לא נמצא' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'שגיאה בבדיקת סטטוס' },
        { status: analyzerResponse.status }
      );
    }

    const statusData: AnalysisStatus = await analyzerResponse.json();

    return NextResponse.json(statusData);
  } catch (error) {
    console.error('שגיאה בבדיקת סטטוס ניתוח:', error);
    return NextResponse.json({ error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}
