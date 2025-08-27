import { NextRequest, NextResponse } from 'next/server';
import { DualStageSessionManager } from '../../../../../lib/auth/dual-stage-session';

/**
 * GET /api/auth/dual-stage/status
 * Get current authentication status in dual-stage flow
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await DualStageSessionManager.getDualStageSession();
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        stage: 'not_authenticated',
        nextStep: '/',
        message: 'לא מחובר למערכת'
      });
    }
    
    // Determine current stage and next step
    let stage: string;
    let nextStep: string;
    let message: string;
    
    if (!session.user.isDualStageComplete) {
      if (session.user.provider === 'google') {
        stage = 'google_complete';
        nextStep = '/auth/moodle-setup';
        message = 'מחובר עם Google, נדרש חיבור לאוניברסיטה';
      } else {
        stage = 'not_authenticated';
        nextStep = '/';
        message = 'נדרש אימות מחדש';
      }
    } else {
      // Check if credentials are still valid
      const credentialsValid = session.user.credentialsValid !== false;
      
      if (credentialsValid) {
        stage = 'dual_stage_complete';
        nextStep = '/dashboard';
        message = 'אימות הושלם בהצלחה';
      } else {
        stage = 'credentials_expired';
        nextStep = '/auth/moodle-setup';
        message = 'פרטי האימות פגי תוקף, נדרש אימות מחדש';
      }
    }
    
    return NextResponse.json({
      authenticated: true,
      stage,
      nextStep,
      message,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        universityId: session.user.universityId,
        universityName: session.user.universityName,
        lastSync: session.user.lastSync,
        hasValidCredentials: session.user.hasValidCredentials,
        credentialsExpiry: session.user.credentialsExpiry
      }
    });
    
  } catch (error) {
    console.error('Dual-stage status error:', error);
    return NextResponse.json(
      { 
        error: 'שגיאה פנימית בשרת',
        authenticated: false,
        stage: 'error',
        nextStep: '/'
      },
      { status: 500 }
    );
  }
}