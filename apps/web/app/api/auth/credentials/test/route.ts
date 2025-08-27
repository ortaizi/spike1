import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth/server-auth';

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
    const { university, username, password } = body;

    if (!university || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרטי התחברות' },
        { status: 400 }
      );
    }

    // בדיקת תקינות האוניברסיטה
    const validUniversities = ['bgu', 'technion', 'huji', 'tau'];
    if (!validUniversities.includes(university)) {
      return NextResponse.json(
        { success: false, error: 'אוניברסיטה לא נתמכת' },
        { status: 400 }
      );
    }

    // בדיקת התחברות אמיתית למודל BGU
    const { moodleConnector } = await import('../../../../../lib/moodle-connector.js');
    
    const testResult = await moodleConnector.testConnection({
      username,
      password,
      university: university as 'bgu' | 'technion' | 'huji' | 'tau'
    });

    if (!testResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: testResult.error || 'שגיאה בהתחברות למערכת האוניברסיטה' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'התחברות למערכת האוניברסיטה הצליחה',
      data: {
        university,
        username,
        moodleData: testResult.data || { connected: true, timestamp: new Date().toISOString() }
      }
    });

  } catch (error) {
    console.error('שגיאה בבדיקת פרטי התחברות:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}