import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth/server-auth';
import { supabase } from '../../../../../lib/db';

/**
 * GET /api/auth/credentials/status
 * בדיקת סטטוס פרטי התחברות קיימים למשתמש
 * מחזיר מידע על האם למשתמש יש כבר פרטי התחברות שמורים ותקפים
 */
export async function GET(request: NextRequest) {
  try {
    // בדיקת אימות משתמש
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'נדרש אימות Google קודם' },
        { status: 401 }
      );
    }

    // חילוץ מזהה אוניברסיטה מהמייל
    const email = session.user.email;
    const domain = email.split('@')[1];
    
    let universityId = '';
    if (domain.includes('post.bgu.ac.il')) {
      universityId = 'bgu';
    } else if (domain.includes('technion.ac.il')) {
      universityId = 'technion';
    } else if (domain.includes('mail.huji.ac.il')) {
      universityId = 'huji';
    } else if (domain.includes('post.tau.ac.il')) {
      universityId = 'tau';
    } else {
      return NextResponse.json(
        { error: 'דומיין האימייל אינו נתמך. כרגע תמיכה רק באוניברסיטת בן-גוריון' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking credential status for ${email} at university ${universityId}`);

    // קריאה לפונקציה בדטהבייס לבדיקת סטטוס הפרטים עם fallback
    let data, error;
    
    try {
      // נסה קודם את הפונקציה העובדת
      const result = await supabase
        .rpc('get_user_university_credentials', {
          user_email_param: email,
          university_id_param: universityId
        });
      data = result.data;
      error = result.error;
    } catch (funcError) {
      console.log('🔄 Fallback to alternative function');
      try {
        const result = await supabase
          .rpc('get_user_credential_status', {
            user_email_param: email,
            university_id_param: universityId
          });
        data = result.data;
        error = result.error;
      } catch (fallbackError) {
        console.error('Both functions failed, using default response');
        // Return default response instead of error
        return NextResponse.json({
          success: true,
          data: {
            userEmail: email,
            universityId: universityId,
            hasCredentials: false,
            credentialsValid: false,
            lastValidation: null,
            needsRevalidation: true,
            username: null,
            authenticationFlow: 'new_user'
          }
        });
      }
    }

    if (error) {
      console.error('Database error checking credential status:', error);
      // Return default response instead of error
      return NextResponse.json({
        success: true,
        data: {
          userEmail: email,
          universityId: universityId,
          hasCredentials: false,
          credentialsValid: false,
          lastValidation: null,
          needsRevalidation: true,
          username: null,
          authenticationFlow: 'new_user'
        }
      });
    }

    const credentialStatus = data?.[0] || data;
    
    if (!credentialStatus) {
      // Return default response instead of error
      return NextResponse.json({
        success: true,
        data: {
          userEmail: email,
          universityId: universityId,
          hasCredentials: false,
          credentialsValid: false,
          lastValidation: null,
          needsRevalidation: true,
          username: null,
          authenticationFlow: 'new_user'
        }
      });
    }

    const response = {
      userEmail: email,
      universityId: universityId,
      hasCredentials: credentialStatus.has_credentials,
      credentialsValid: credentialStatus.credentials_valid,
      lastValidation: credentialStatus.last_validation,
      needsRevalidation: credentialStatus.needs_revalidation,
      username: credentialStatus.username,
      authenticationFlow: determineAuthenticationFlow(credentialStatus)
    };

    console.log(`✅ Credential status for ${email}:`, response);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error checking credential status:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}

/**
 * קביעת זרימת האימות בהתאם לסטטוס הפרטים הקיימים
 */
function determineAuthenticationFlow(credentialStatus: any): string {
  if (!credentialStatus.has_credentials) {
    return 'new_user'; // משתמש חדש - נדרש הזנת פרטים
  }
  
  if (credentialStatus.credentials_valid && !credentialStatus.needs_revalidation) {
    return 'existing_user_auto'; // משתמש קיים עם פרטים תקפים - התחברות אוטומטית
  }
  
  if (credentialStatus.has_credentials && credentialStatus.needs_revalidation) {
    return 'existing_user_revalidate'; // משתמש קיים אך נדרש אימות מחדש
  }
  
  return 'existing_user_manual'; // משתמש קיים אך נדרש הזנה ידנית
}