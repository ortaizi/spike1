import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/auth-provider';
import { getActiveSyncJob } from '../../../../lib/database/sync-jobs';

export async function GET(request: NextRequest) {
  try {
    // בדיקת הרשאות משתמש
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'לא מורשה' },
        { status: 401 }
      );
    }

    // קבלת job פעיל של המשתמש
    const activeJob = await getActiveSyncJob(session.user.id);

    if (!activeJob) {
      return NextResponse.json({
        success: true,
        hasActiveJob: false,
        message: 'אין job פעיל'
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveJob: true,
      jobId: activeJob.id,
      status: activeJob.status,
      progress: activeJob.progress,
      message: activeJob.message,
      data: activeJob.data,
      createdAt: activeJob.createdAt,
      updatedAt: activeJob.updatedAt
    });

  } catch (error) {
    console.error('שגיאה בבדיקת job פעיל:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
} 