import { NextRequest, NextResponse } from 'next/server';
import { DualStageSessionManager } from '@/lib/auth/dual-stage-session';
import { SecurityLimiter } from '@/lib/auth/encryption';
import { supabase } from '@/lib/db';

/**
 * POST /api/sync/trigger
 * Trigger a manual sync of university data
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for sync operations - more restrictive
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = SecurityLimiter.checkRateLimit(`sync_${clientIP}`, 2, 10 * 60 * 1000); // 2 syncs per 10 minutes
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'יותר מדי בקשות סנכרון. אפשר לבצע סנכרון מרבי פעמיים כל 10 דקות.',
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        },
        { status: 429 }
      );
    }
    
    // Get session and verify dual-stage completion
    const session = await DualStageSessionManager.getDualStageSession();
    if (!session?.user?.isDualStageComplete) {
      return NextResponse.json(
        { error: 'נדרש אימות דו-שלבי מלא לביצוע סנכרון' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { force = false } = body;
    
    // Check for active sync jobs
    console.log(`🔄 Checking for active sync jobs for user ${session.user.email}`);
    const { data: activeSyncJobs, error: syncCheckError } = await supabase
      .from('sync_jobs')
      .select('id, status, created_at')
      .eq('user_id', session.user.id)
      .in('status', ['pending', 'running', 'creating_tables', 'fetching_courses', 'analyzing_content', 'classifying_data', 'saving_to_database'])
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (syncCheckError) {
      console.error('Error checking sync jobs:', syncCheckError);
    }
    
    const activeJob = activeSyncJobs?.[0];
    
    if (activeJob && !force) {
      console.log(`⏳ Active sync job found for user ${session.user.email}: ${activeJob.id}`);
      return NextResponse.json({
        success: false,
        error: 'סנכרון כבר בביצוע',
        message: 'יש תהליך סנכרון פעיל. אנא המתן להשלמתו או השתמש בדגל force=true לביטול.',
        activeJobId: activeJob.id,
        jobStatus: activeJob.status,
        jobStarted: activeJob.created_at
      });
    }
    
    // Get stored credentials
    console.log(`🔐 Getting stored credentials for user ${session.user.email}`);
    const credentials = await DualStageSessionManager.getUserCredentials(session.user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: 'לא נמצאו פרטי התחברות שמורים. נדרש אימות מחדש.' },
        { status: 404 }
      );
    }
    
    // Validate stored credentials before starting sync
    if (!force) {
      console.log('🧪 Validating stored credentials...');
      const credentialsValid = await DualStageSessionManager.areCredentialsValid(session.user.id);
      
      if (!credentialsValid) {
        return NextResponse.json({
          success: false,
          error: 'פרטי הכניסה השמורים אינם תקינים',
          message: 'פרטי הכניסה למודל פגי תוקף או אינם תקינים. נדרש אימות מחדש.',
          requiresReauth: true
        }, { status: 401 });
      }
    }
    
    // Cancel active job if force is true
    if (activeJob && force) {
      console.log(`🚫 Force cancelling active sync job ${activeJob.id}`);
      try {
        await supabase
          .from('sync_jobs')
          .update({
            status: 'cancelled',
            message: 'בוטל על ידי סנכרון כפוי חדש',
            updated_at: new Date().toISOString()
          })
          .eq('id', activeJob.id);
      } catch (cancelError) {
        console.warn('Failed to cancel active job:', cancelError);
      }
    }
    
    // Start background sync
    console.log(`🚀 Starting background sync for user ${session.user.email}`);
    try {
      const { startBackgroundSync } = await import('@/lib/background-sync');
      const syncResult = await startBackgroundSync(session.user.id, {
        moodle_username: credentials.username,
        moodle_password: credentials.password,
        university_id: credentials.universityId
      });
      
      if (!syncResult.success) {
        return NextResponse.json({
          success: false,
          error: 'שגיאה בהתחלת תהליך הסנכרון',
          message: syncResult.message || 'לא ניתן להתחיל את תהליך הסנכרון כעת'
        }, { status: 500 });
      }
      
      console.log(`✅ Sync started successfully for user ${session.user.email}, job ID: ${syncResult.jobId}`);
      
      return NextResponse.json({
        success: true,
        message: 'תהליך הסנכרון החל בהצלחה',
        jobId: syncResult.jobId,
        estimatedDuration: 120, // seconds
        university: {
          id: credentials.universityId,
          name: session.user.universityName
        },
        startedAt: new Date().toISOString()
      });
      
    } catch (syncError) {
      console.error('Background sync start error:', syncError);
      return NextResponse.json({
        success: false,
        error: 'שגיאה בהתחלת תהליך הסנכרון',
        message: 'תהליך הסנכרון נכשל להתחיל. נסה שוב מאוחר יותר.'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Sync trigger error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'שגיאה פנימית בשרת',
        message: 'לא ניתן להתחיל את תהליך הסנכרון כעת'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/trigger
 * Get information about sync capabilities and status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await DualStageSessionManager.getDualStageSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות למערכת' },
        { status: 401 }
      );
    }
    
    // Check if user can trigger sync
    const canSync = session.user.isDualStageComplete && session.user.hasValidCredentials;
    
    // Get last sync info
    const { data: lastSyncJob } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Check rate limits
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = SecurityLimiter.checkRateLimit(`sync_check_${clientIP}`, 50, 10 * 60 * 1000);
    
    return NextResponse.json({
      canSync,
      university: {
        id: session.user.universityId,
        name: session.user.universityName
      },
      lastSync: lastSyncJob ? {
        id: lastSyncJob.id,
        status: lastSyncJob.status,
        startedAt: lastSyncJob.created_at,
        completedAt: lastSyncJob.updated_at,
        message: lastSyncJob.message,
        progress: lastSyncJob.progress
      } : null,
      rateLimits: {
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString()
      },
      estimatedDuration: 120, // seconds
      syncCapabilities: {
        courses: true,
        assignments: true,
        grades: true,
        announcements: true,
        files: true
      }
    });
    
  } catch (error) {
    console.error('Sync info error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}