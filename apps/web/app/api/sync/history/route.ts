import { NextRequest, NextResponse } from 'next/server';
import { DualStageSessionManager } from '../../../../lib/auth/dual-stage-session';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/sync/history
 * Get user's sync job history with detailed information
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 results
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // Filter by status
    
    console.log(`📊 Getting sync history for user ${session.user.email}, limit: ${limit}, offset: ${offset}`);
    
    // Build query
    let query = supabase
      .from('sync_jobs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Add status filter if provided
    if (status && ['pending', 'running', 'completed', 'error', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }
    
    const { data: syncHistory, error } = await query;
    
    if (error) {
      console.error('Error fetching sync history:', error);
      return NextResponse.json(
        { error: 'שגיאה בטעינת היסטוריית הסנכרון' },
        { status: 500 }
      );
    }
    
    // Enrich history data with calculated fields
    const enrichedHistory = syncHistory?.map(job => {
      const startTime = new Date(job.created_at);
      const endTime = job.updated_at ? new Date(job.updated_at) : new Date();
      const duration = job.status === 'completed' || job.status === 'error' 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : null;
      
      // Parse job data if available
      let jobData = null;
      try {
        jobData = job.data ? (typeof job.data === 'string' ? JSON.parse(job.data) : job.data) : null;
      } catch (parseError) {
        console.warn('Failed to parse job data:', parseError);
      }
      
      return {
        id: job.id,
        status: job.status,
        message: job.message || getDefaultStatusMessage(job.status),
        progress: job.progress || 0,
        startedAt: job.created_at,
        completedAt: job.status === 'completed' || job.status === 'error' ? job.updated_at : null,
        duration, // in seconds
        data: jobData ? {
          coursesProcessed: jobData.totalCourses || 0,
          itemsProcessed: jobData.totalItems || 0,
          assignmentsFound: jobData.totalAssignments || 0,
          announcementsFound: jobData.totalAnnouncements || 0,
          filesFound: jobData.totalFiles || 0,
          errorDetails: jobData.errors || null
        } : null,
        university: {
          id: session.user.universityId,
          name: session.user.universityName
        }
      };
    }) || [];
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
    
    // Calculate statistics
    const stats = {
      total: totalCount || 0,
      completed: enrichedHistory.filter(job => job.status === 'completed').length,
      failed: enrichedHistory.filter(job => job.status === 'error').length,
      pending: enrichedHistory.filter(job => ['pending', 'running'].includes(job.status)).length,
      averageDuration: enrichedHistory
        .filter(job => job.duration !== null)
        .reduce((acc, job, _, arr) => acc + (job.duration || 0) / arr.length, 0) || 0
    };
    
    console.log(`✅ Retrieved ${enrichedHistory.length} sync jobs for user ${session.user.email}`);
    
    return NextResponse.json({
      history: enrichedHistory,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      statistics: stats,
      filters: {
        availableStatuses: ['pending', 'running', 'completed', 'error', 'cancelled'],
        currentStatusFilter: status || 'all'
      }
    });
    
  } catch (error) {
    console.error('Sync history error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync/history
 * Clear sync history (keep last 5 jobs)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await DualStageSessionManager.getDualStageSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות למערכת' },
        { status: 401 }
      );
    }
    
    console.log(`🗑️ Clearing sync history for user ${session.user.email}`);
    
    // Get the 5 most recent jobs to keep
    const { data: recentJobs } = await supabase
      .from('sync_jobs')
      .select('id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const keepIds = recentJobs?.map(job => job.id) || [];
    
    // Delete older jobs
    let deleteQuery = supabase
      .from('sync_jobs')
      .delete()
      .eq('user_id', session.user.id)
      .neq('status', 'running') // Don't delete running jobs
      .neq('status', 'pending'); // Don't delete pending jobs
    
    if (keepIds.length > 0) {
      deleteQuery = deleteQuery.not('id', 'in', `(${keepIds.join(',')})`);
    }
    
    const { data: deletedJobs, error } = await deleteQuery.select('id');
    
    if (error) {
      console.error('Error clearing sync history:', error);
      return NextResponse.json(
        { error: 'שגיאה במחיקת היסטוריית הסנכרון' },
        { status: 500 }
      );
    }
    
    const deletedCount = deletedJobs?.length || 0;
    
    console.log(`✅ Cleared ${deletedCount} sync jobs for user ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      message: `נמחקו ${deletedCount} תהליכי סנכרון ישנים`,
      deletedCount,
      keptCount: keepIds.length
    });
    
  } catch (error) {
    console.error('Clear sync history error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}

/**
 * Get default status message for sync jobs
 */
function getDefaultStatusMessage(status: string): string {
  switch (status) {
    case 'pending': return 'ממתין בתור לעיבוד';
    case 'running': return 'תהליך סנכרון פעיל';
    case 'creating_tables': return 'מכין מבני נתונים';
    case 'fetching_courses': return 'אוסף נתוני קורסים';
    case 'analyzing_content': return 'מנתח תוכן קורסים';
    case 'classifying_data': return 'מסווג ומארגן נתונים';
    case 'saving_to_database': return 'שומר נתונים במאגר';
    case 'completed': return 'סנכרון הושלם בהצלחה';
    case 'error': return 'תקלה בתהליך הסנכרון';
    case 'cancelled': return 'תהליך בוטל';
    default: return 'סטטוס לא ידוע';
  }
}