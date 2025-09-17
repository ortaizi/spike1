import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/auth-provider';
import { getSyncJobStatus } from '../../../../lib/database/sync-jobs';

export async function GET(_request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    // בדיקת הרשאות משתמש
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'לא מורשה' }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'חסר job ID' }, { status: 400 });
    }

    // קבלת סטטוס ה-job
    const jobStatus = await getSyncJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json({ success: false, error: 'Job לא נמצא' }, { status: 404 });
    }

    // בדיקה שהמשתמש מורשה לראות את ה-job הזה
    if (jobStatus.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה לצפות ב-job זה' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: jobStatus.status,
      progress: jobStatus.progress,
      message: jobStatus.message,
      data: jobStatus.data,
      createdAt: jobStatus.created_at,
      updatedAt: jobStatus.updated_at,
    });
  } catch (error) {
    console.error('שגיאה בבדיקת סטטוס job:', error);
    return NextResponse.json({ success: false, error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}
