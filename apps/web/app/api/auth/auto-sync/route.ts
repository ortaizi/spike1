import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/auth-provider';
import { env } from '../../../../lib/env';

// Helper function to get session
async function getSession() {
  try {
    const session = await auth();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // בדיקת הרשאות משתמש
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'לא מורשה' }, { status: 401 });
    }

    const body = await request.json();
    const { moodle_username, moodle_password, university_id } = body;

    if (!moodle_username || !moodle_password || !university_id) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרטי התחברות למודל' },
        { status: 400 }
      );
    }

    // יצירת user_id ייחודי
    const user_id = `user_${session.user.email.replace('@', '_').replace('.', '_')}`;

    // שלב 1: סנכרון נתונים מהמודל
    console.log('🚀 מתחיל סנכרון אוטומטי עבור:', user_id);

    const syncApiUrl = env.SYNC_API_URL || 'http://localhost:8000';

    const syncResponse = await fetch(`${syncApiUrl}/sync/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        moodle_username,
        moodle_password,
        force_sync: true,
      }),
    });

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      console.error('❌ שגיאה בסנכרון:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.detail || 'שגיאה בסנכרון נתונים' },
        { status: syncResponse.status }
      );
    }

    const syncResult = await syncResponse.json();
    console.log('✅ סנכרון הושלם בהצלחה');

    // שלב 2: ניתוח קורסים
    console.log('🔍 מתחיל ניתוח קורסים...');

    const analyzerApiUrl = env.COURSE_ANALYZER_API_URL || 'http://localhost:8000';

    const analysisResponse = await fetch(`${analyzerApiUrl}/analyze-user-courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        course_data: syncResult.courses || [],
        force_reanalysis: false,
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      console.error('❌ שגיאה בניתוח:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.detail || 'שגיאה בניתוח קורסים' },
        { status: analysisResponse.status }
      );
    }

    const analysisResult = await analysisResponse.json();
    console.log('✅ ניתוח הושלם בהצלחה');

    // שלב 3: עדכון סטטוס המשתמש
    try {
      const { supabase } = await import('../../../../lib/db');

      await supabase
        .from('users')
        .update({
          updatedAt: new Date().toISOString(),
          preferences: {
            autoSyncEnabled: true,
            lastAutoSync: new Date().toISOString(),
            syncStatus: 'completed',
            analysisStatus: 'completed',
          },
        })
        .eq('email', session.user.email);
    } catch (dbError) {
      console.warn('⚠️ שגיאה בעדכון סטטוס בדטה בייס:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'סנכרון וניתוח אוטומטי הושלמו בהצלחה',
      data: {
        sync: syncResult,
        analysis: analysisResult,
      },
    });
  } catch (error) {
    console.error('❌ שגיאה בסנכרון אוטומטי:', error);
    return NextResponse.json({ success: false, error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    // בדיקת הרשאות משתמש
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'לא מורשה' }, { status: 401 });
    }

    const user_id = `user_${session.user.email.replace('@', '_').replace('.', '_')}`;

    // בדיקת סטטוס סנכרון - נחזיר נתונים מדומים כרגע
    const syncStatus = {
      status: 'completed',
      progress: 100,
      message: 'סנכרון הושלם בהצלחה',
    };

    // בדיקת סטטוס ניתוח - נחזיר נתונים מדומים כרגע
    const analysisStatus = {
      status: 'completed',
      progress: 100,
      message: 'ניתוח הושלם בהצלחה',
    };

    return NextResponse.json({
      success: true,
      data: {
        sync_status: syncStatus,
        analysis_status: analysisStatus,
        user_id,
      },
    });
  } catch (error) {
    console.error('שגיאה בבדיקת סטטוס:', error);
    return NextResponse.json({ success: false, error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}
