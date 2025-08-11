import { NextRequest, NextResponse } from 'next/server';
import { DualStageSessionManager } from '@/lib/auth/dual-stage-session';
import { SecurityLimiter } from '@/lib/auth/encryption';

/**
 * GET /api/auth/credentials/test
 * Test stored credentials validity against university system
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for credential testing
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = SecurityLimiter.checkRateLimit(`test_${clientIP}`, 10, 15 * 60 * 1000); // 10 tests per 15 minutes
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'יותר מדי בדיקות פרטי כניסה. נסה שוב בעוד כמה דקות.',
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        },
        { status: 429 }
      );
    }
    
    // Get session
    const session = await DualStageSessionManager.getDualStageSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות למערכת' },
        { status: 401 }
      );
    }
    
    // Check if user has university setup
    if (!session.user.isDualStageComplete) {
      return NextResponse.json({
        valid: false,
        message: 'לא הושלם אימות האוניברסיטה',
        requiresSetup: true
      });
    }
    
    console.log(`🧪 Testing stored credentials for user ${session.user.email}`);
    
    // Test stored credentials
    const isValid = await DualStageSessionManager.areCredentialsValid(session.user.id);
    
    // Get updated session data after validation
    const updatedSession = await DualStageSessionManager.getDualStageSession();
    
    const responseData = {
      valid: isValid,
      message: isValid 
        ? 'פרטי הכניסה תקינים ועובדים כהלכה' 
        : 'פרטי הכניסה לא תקינים או פגי תוקף - נדרש אימות מחדש',
      university: {
        id: session.user.universityId,
        name: session.user.universityName
      },
      lastSync: updatedSession?.user.lastSync,
      credentialsExpiry: updatedSession?.user.credentialsExpiry,
      requiresSetup: !isValid
    };
    
    console.log(`${isValid ? '✅' : '❌'} Credential test completed for user ${session.user.email}: ${isValid ? 'valid' : 'invalid'}`);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Credential test error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'שגיאה בבדיקת פרטי הכניסה',
        message: 'לא ניתן לבדוק את פרטי הכניסה כעת. נסה שוב מאוחר יותר.'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/credentials/test
 * Test specific credentials without saving them
 */
export async function POST(request: NextRequest) {
  try {
    // Stricter rate limiting for testing arbitrary credentials
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = SecurityLimiter.checkRateLimit(`test_arbitrary_${clientIP}`, 3, 15 * 60 * 1000); // 3 tests per 15 minutes
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'יותר מדי ניסיונות בדיקה. נסה שוב בעוד כמה דקות.' },
        { status: 429 }
      );
    }
    
    // Get session
    const session = await DualStageSessionManager.getDualStageSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות למערכת' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { username, password, universityId } = body;
    
    if (!username || !password || !universityId) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }
    
    // Import authentication function
    const { authenticateWithUniversity } = await import('@/lib/auth/auth-provider');
    
    console.log(`🧪 Testing arbitrary credentials for user ${session.user.email} at ${universityId}`);
    
    // Test credentials
    const authResult = await authenticateWithUniversity(username, password, universityId);
    
    console.log(`${authResult.success ? '✅' : '❌'} Arbitrary credential test: ${authResult.success ? 'valid' : 'invalid'}`);
    
    return NextResponse.json({
      valid: authResult.success,
      message: authResult.success 
        ? 'פרטי הכניסה תקינים' 
        : authResult.message || 'פרטי הכניסה אינם תקינים',
      university: authResult.university ? {
        id: authResult.university.id,
        name: authResult.university.name
      } : null
    });
    
  } catch (error) {
    console.error('Arbitrary credential test error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'שגיאה בבדיקת פרטי הכניסה'
      },
      { status: 500 }
    );
  }
}