import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth/server-auth';
import { csrfProtection, rateLimit } from '../../../../../lib/security/csrf-protection';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (10 requests per minute)
    const rateLimitResponse = await rateLimit(10, 60000)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CSRF protection
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // בדיקת הרשאות משתמש
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'לא מורשה' }, { status: 401 });
    }

    const body = await request.json();
    const { university, username, password } = body;

    if (!university || !username || !password) {
      return NextResponse.json({ success: false, error: 'חסרים פרטי התחברות' }, { status: 400 });
    }

    // בדיקת תקינות האוניברסיטה
    const validUniversities = ['bgu', 'technion', 'huji', 'tau'];
    if (!validUniversities.includes(university)) {
      return NextResponse.json({ success: false, error: 'אוניברסיטה לא נתמכת' }, { status: 400 });
    }

    // שמירת פרטי התחברות באמצעות MoodleConnector
    const { moodleConnector } = await import('../../../../../lib/moodle-connector.js');

    // בדיקת התחברות תחילה
    const testResult = await moodleConnector.testConnection({
      username,
      password,
      university: university as 'bgu' | 'technion' | 'huji' | 'tau',
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error || 'שגיאה בבדיקת פרטי התחברות',
        },
        { status: 400 }
      );
    }

    // שמירת הפרטים לדאטהבייס
    await moodleConnector.saveCredentials(session.user.id, {
      username,
      password,
      university: university as 'bgu' | 'technion' | 'huji' | 'tau',
    });

    console.log('✅ פרטי התחברות למודל נשמרו בהצלחה');

    // עדכון סטטוס המשתמש במסד הנתונים
    try {
      const updateResponse = await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universityCredentialsSaved: true,
          university: university,
          lastCredentialsUpdate: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to update user onboarding status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'פרטי ההתחברות נשמרו בהצלחה',
      data: {
        userId: session.user.id,
        university,
        username,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('שגיאה בשמירת פרטי התחברות:', error);
    return NextResponse.json({ success: false, error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}
