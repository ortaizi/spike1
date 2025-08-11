import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unifiedAuthOptions } from '@/lib/auth/unified-auth';
import { authenticateWithUniversity } from '@/lib/auth/auth-provider';
import { CredentialsEncryption, SecurityLimiter } from '@/lib/auth/encryption';
import { DualStageSessionManager } from '@/lib/auth/dual-stage-session';
import { supabase } from '@/lib/db';

/**
 * POST /api/auth/credentials/save
 * Save encrypted university credentials after validation
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for save operations
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = SecurityLimiter.checkRateLimit(`save_${clientIP}`, 3, 5 * 60 * 1000); // 3 attempts per 5 minutes
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'יותר מדי ניסיונות שמירה. נסה שוב בעוד כמה דקות.' },
        { status: 429 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(unifiedAuthOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות Google קודם' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { username, password, universityId, skipValidation = false } = body;
    
    if (!username || !password || !universityId) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }
    
    console.log(`💾 Saving credentials for user ${session.user.email} at university ${universityId}`);
    
    // Validate credentials first (unless explicitly skipped)
    if (!skipValidation) {
      console.log('🔐 Validating credentials before saving...');
      const authResult = await authenticateWithUniversity(username, password, universityId);
      
      if (!authResult.success) {
        return NextResponse.json(
          { error: 'פרטי הכניסה אינם תקינים - לא ניתן לשמור' },
          { status: 401 }
        );
      }
      
      console.log('✅ Credentials validated successfully');
    }
    
    // Encrypt credentials
    console.log('🔒 Encrypting credentials...');
    const encrypted = CredentialsEncryption.encryptCredentials(username, password);
    
    // Save to database
    console.log('💾 Saving encrypted credentials to database...');
    const { error: saveError } = await supabase
      .from('university_credentials')
      .upsert({
        user_id: session.user.id,
        university_id: universityId,
        encrypted_username: encrypted.encryptedUsername,
        encrypted_password: encrypted.encryptedPassword,
        auth_tag: encrypted.authTag,
        iv: encrypted.iv,
        is_valid: true,
        credentials_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        last_sync: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,university_id'
      });
      
    if (saveError) {
      console.error('Error saving credentials:', saveError);
      return NextResponse.json(
        { error: 'שגיאה בשמירת פרטי הכניסה' },
        { status: 500 }
      );
    }
    
    // Mark user setup as complete
    await DualStageSessionManager.markSetupComplete(session.user.id);
    
    // Log successful save
    try {
      await supabase.from('auth_attempts').insert({
        user_identifier: session.user.email,
        attempt_type: 'moodle',
        university_id: universityId,
        success: true,
        error_message: 'credentials_saved',
        ip_address: clientIP,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log credential save:', logError);
    }
    
    // Start background sync
    let syncJobId = null;
    try {
      console.log('🔄 Starting background sync...');
      const { startBackgroundSync } = await import('@/lib/background-sync');
      const syncResult = await startBackgroundSync(session.user.id, {
        moodle_username: username,
        moodle_password: password,
        university_id: universityId
      });
      
      if (syncResult.success) {
        syncJobId = syncResult.jobId;
        console.log('✅ Background sync started:', syncJobId);
      } else {
        console.warn('⚠️ Background sync failed to start:', syncResult.message);
      }
    } catch (syncError) {
      console.warn('⚠️ Background sync error:', syncError);
    }
    
    console.log(`✅ Credentials saved successfully for user ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'פרטי הכניסה נשמרו בהצלחה והצפנו במאגר מאובטח',
      syncJobId,
      university: {
        id: universityId,
        name: universityId // Will be enriched by frontend
      }
    });
    
  } catch (error) {
    console.error('Credential save error:', error);
    
    // Log error
    try {
      const session = await getServerSession(unifiedAuthOptions);
      const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      
      await supabase.from('auth_attempts').insert({
        user_identifier: session?.user?.email || 'unknown',
        attempt_type: 'moodle',
        university_id: null,
        success: false,
        error_message: 'save_error',
        ip_address: clientIP,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log save error:', logError);
    }
    
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}