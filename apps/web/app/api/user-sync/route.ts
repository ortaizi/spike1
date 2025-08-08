import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // בדיקת הרשאות משתמש
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { moodle_username, moodle_password, force_sync = false } = body;

    if (!moodle_username || !moodle_password) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרטי התחברות למודל' },
        { status: 400 }
      );
    }

    // יצירת user_id ייחודי
    const user_id = `user_${session.user.email.replace('@', '_').replace('.', '_')}`;

    // קריאה ל-API הסנכרון
    const syncApiUrl = process.env.SYNC_API_URL || 'http://localhost:8000';
    
    const syncResponse = await fetch(`${syncApiUrl}/sync/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        moodle_username,
        moodle_password,
        force_sync
      }),
    });

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      return NextResponse.json(
        { success: false, error: errorData.detail || 'שגיאה בסנכרון' },
        { status: syncResponse.status }
      );
    }

    const syncResult = await syncResponse.json();

    return NextResponse.json({
      success: true,
      message: 'סנכרון הושלם בהצלחה',
      data: syncResult
    });

  } catch (error) {
    console.error('שגיאה בסנכרון נתונים:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // בדיקת הרשאות משתמש
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const user_id = `user_${session.user.email.replace('@', '_').replace('.', '_')}`;
    const syncApiUrl = process.env.SYNC_API_URL || 'http://localhost:8000';

    // בדיקת סטטוס סנכרון
    const statusResponse = await fetch(`${syncApiUrl}/user/${user_id}/status`);
    
    if (!statusResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'לא ניתן לבדוק סטטוס' },
        { status: statusResponse.status }
      );
    }

    const statusData = await statusResponse.json();

    return NextResponse.json({
      success: true,
      data: statusData
    });

  } catch (error) {
    console.error('שגיאה בבדיקת סטטוס:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
} 