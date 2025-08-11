import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unifiedAuthOptions } from '@/lib/auth/unified-auth';
import { authenticateWithUniversity } from '@/lib/auth/auth-provider';
import { SecurityLimiter } from '@/lib/auth/encryption';
import { supabase } from '@/lib/db';

/**
 * POST /api/auth/credentials/validate
 * Validate university credentials against the actual Moodle system
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - max 5 attempts per 15 minutes per IP
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = SecurityLimiter.checkRateLimit(`validate_${clientIP}`, 5, 15 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      return NextResponse.json(
        { 
          error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.',
          resetTime: resetTime.toISOString(),
          remaining: rateLimitResult.remaining
        },
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
    const { username, password, universityId } = body;
    
    if (!username || !password || !universityId) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים: שם משתמש, סיסמה ומוסד לימודים' },
        { status: 400 }
      );
    }
    
    // Validate input lengths and format
    if (username.length > 100 || password.length > 100) {
      return NextResponse.json(
        { error: 'פרטי הכניסה ארוכים מדי' },
        { status: 400 }
      );
    }
    
    console.log(`🔐 Validating credentials for user ${session.user.email} at university ${universityId}`);
    
    // Authenticate against university
    const authResult = await authenticateWithUniversity(username, password, universityId);
    
    // Log authentication attempt
    const attemptLog = {
      user_identifier: session.user.email,
      attempt_type: 'moodle' as const,
      university_id: universityId,
      success: authResult.success,
      error_message: authResult.success ? null : authResult.message,
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent'),
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('auth_attempts').insert(attemptLog);
    } catch (logError) {
      console.warn('Failed to log auth attempt:', logError);
    }
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: authResult.message || 'שם משתמש או סיסמה אינם נכונים',
          university: authResult.university
        },
        { status: 401 }
      );
    }
    
    console.log(`✅ Credentials validated successfully for ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'פרטי הכניסה תקינים ואומתו בהצלחה',
      university: {
        id: authResult.university?.id,
        name: authResult.university?.name,
        moodleUrl: authResult.university?.moodleUrl
      }
    });
    
  } catch (error) {
    console.error('Credential validation error:', error);
    
    // Log error attempt
    try {
      const session = await getServerSession(unifiedAuthOptions);
      const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      
      await supabase.from('auth_attempts').insert({
        user_identifier: session?.user?.email || 'unknown',
        attempt_type: 'moodle',
        university_id: null,
        success: false,
        error_message: 'Internal server error',
        ip_address: clientIP,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log error attempt:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'שגיאה פנימית בשרת. נסה שוב מאוחר יותר.' 
      },
      { status: 500 }
    );
  }
}