import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unifiedAuthOptions } from '../../../../lib/auth/unified-auth';
import { authenticateWithMoodle } from '../../../../lib/moodle-client';
import { extractDataFromEmail } from '../../../../lib/university-utils';
import { supabase } from '../../../../lib/db';
import { z } from 'zod';

// Validation schema for Moodle credentials  
const moodleCredentialsSchema = z.object({
  password: z.string().min(1, 'סיסמה נדרשת'),
  universityId: z.string().optional(),
  username: z.string().optional()
});

// Simple encryption for storing credentials (replace with proper encryption in production)
function encryptPassword(password: string): string {
  // This is a placeholder - in production, use proper encryption like AES
  return Buffer.from(password).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(unifiedAuthOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'לא מורשה - נדרשת התחברות' 
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { password, universityId: providedUniversityId, username: providedUsername } = moodleCredentialsSchema.parse(body);

    console.log(`🔐 Moodle validation request for user: ${session.user.email}`);

    // Extract user data from email
    const emailData = await extractDataFromEmail(session.user.email);
    
    if (!emailData.isValidUniversityEmail || !emailData.university) {
      return NextResponse.json(
        { 
          success: false,
          error: 'כתובת האימייל לא שייכת לאוניברסיטה נתמכת' 
        },
        { status: 400 }
      );
    }

    // Use extracted data or provided data
    const universityId = providedUniversityId || emailData.university?.id;
    const username = providedUsername || emailData.username;

    if (!universityId) {
      return NextResponse.json(
        {
          success: false,
          error: 'לא ניתן לזהות את האוניברסיטה'
        },
        { status: 400 }
      );
    }

    // Verify university is active in our database
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .eq('is_active', true)
      .single();

    if (universityError || !university) {
      console.error('❌ University not found or inactive:', universityId);
      return NextResponse.json(
        { 
          success: false,
          error: 'האוניברסיטה לא נתמכת כרגע' 
        },
        { status: 400 }
      );
    }

    console.log(`🎯 Validating credentials for ${username} at ${university.name_he}`);

    // Authenticate with real Moodle (preserving existing BGU logic)
    const startTime = Date.now();
    const authResult = await authenticateWithMoodle(username, password, universityId);
    const responseTime = Date.now() - startTime;

    console.log(`📊 Moodle auth result: ${authResult.success ? 'Success' : 'Failed'} (${responseTime}ms)`);

    // Log the authentication attempt
    try {
      const { error: logError } = await supabase.rpc('log_auth_attempt', {
        user_email_param: session.user.email,
        university_id_param: universityId,
        success_param: authResult.success,
        authentication_type_param: 'moodle_validation',
        response_time_ms_param: responseTime,
        error_message_param: authResult.success ? null : (authResult.error || authResult.message)
      });

      if (logError) {
        console.warn('⚠️ Failed to log auth attempt:', logError);
      }
    } catch (logError) {
      console.warn('⚠️ Error logging auth attempt:', logError);
    }

    if (!authResult.success) {
      // Increment failed validation attempts
      try {
        await supabase.rpc('increment_validation_attempts', {
          user_email_param: session.user.email,
          university_id_param: universityId
        });
      } catch (incrementError) {
        console.warn('⚠️ Failed to increment validation attempts:', incrementError);
      }

      return NextResponse.json(
        { 
          success: false,
          error: authResult.message || 'שגיאה בהתחברות למודל',
          details: authResult.error
        },
        { status: 401 }
      );
    }

    // Save credentials using new schema
    try {
      const encryptedPassword = encryptPassword(password);
      
      // First, ensure user exists using the same function as onboarding
      const { data: userData, error: userError } = await supabase.rpc('get_or_create_user_by_google_id', {
        email_param: session.user.email,
        google_id_param: session.user.id,
        name_param: session.user.name || ''
      });
      
      if (userError) {
        console.error('❌ Failed to create/get user:', userError);
        return NextResponse.json(
          { 
            success: false,
            error: 'שגיאה ביצירת משתמש' 
          },
          { status: 500 }
        );
      }
      
      console.log('✅ User ensured before credential save:', session.user.email);
      
      // Save credentials using the new function
      const { data: credentialResult, error: credentialError } = await supabase.rpc('save_validated_credentials', {
        user_email_param: session.user.email,
        university_id_param: universityId,
        username_param: username,
        encrypted_password_param: encryptedPassword
      });

      if (credentialError) {
        console.error('❌ Failed to save credentials:', credentialError);
        return NextResponse.json(
          { 
            success: false,
            error: 'שגיאה בשמירת הנתונים' 
          },
          { status: 500 }
        );
      }

      console.log('✅ Credentials saved successfully with new schema');
    } catch (saveError) {
      console.error('❌ Error saving credentials:', saveError);
      return NextResponse.json(
        { 
          success: false,
          error: 'שגיאה בשמירת הנתונים' 
        },
        { status: 500 }
      );
    }

    // Return success response with university information
    return NextResponse.json({
      success: true,
      message: 'הנתונים נשמרו בהצלחה והגדרת החשבון הושלמה',
      user: {
        email: session.user.email,
        university: university.name_he,
        universityId: universityId,
        username: username,
        onboardingCompleted: true
      },
      university: {
        id: university.id,
        name: university.name_he,
        nameEn: university.name_en,
        domain: university.domain,
        supportedFeatures: university.supported_features
      },
      authInfo: {
        userInfo: authResult.userInfo,
        validatedAt: new Date().toISOString()
      },
      // Signal that the client should refresh the session
      shouldUpdateSession: true
    });

  } catch (error) {
    console.error('❌ Moodle validation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'נתונים לא תקינים',
          details: error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'שגיאה פנימית בשרת' 
      },
      { status: 500 }
    );
  }
}

// GET method to check current validation status
export async function GET() {
  try {
    const session = await getServerSession(unifiedAuthOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'לא מורשה' 
        },
        { status: 401 }
      );
    }

    // Extract university info from email
    const emailData = await extractDataFromEmail(session.user.email);
    
    if (!emailData.isValidUniversityEmail || !emailData.university) {
      return NextResponse.json(
        { 
          hasCredentials: false,
          error: 'כתובת האימייל לא שייכת לאוניברסיטה נתמכת' 
        }
      );
    }

    // Get university information from database
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', emailData.university.id)
      .single();

    if (universityError || !university || !university.is_active) {
      return NextResponse.json(
        { 
          hasCredentials: false,
          error: 'האוניברסיטה לא נתמכת כרגע' 
        }
      );
    }

    // Check current credential status using new schema
    const { data: credentialStatus, error } = await supabase.rpc('get_user_credential_status', {
      user_email_param: session.user.email,
      university_id_param: emailData.university.id
    });

    if (error) {
      console.error('❌ Error checking credential status:', error);
      return NextResponse.json(
        { 
          hasCredentials: false,
          error: 'שגיאה בבדיקת הנתונים' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasCredentials: credentialStatus?.has_credentials || false,
      credentialsValid: credentialStatus?.credentials_valid || false,
      needsRevalidation: credentialStatus?.needs_revalidation || true,
      lastValidation: credentialStatus?.last_validation,
      university: {
        id: university.id,
        name: university.name_he,
        nameEn: university.name_en,
        domain: university.domain,
        supportedFeatures: university.supported_features,
        isActive: university.is_active
      },
      username: emailData.username
    });

  } catch (error) {
    console.error('❌ Credential status check error:', error);
    return NextResponse.json(
      { 
        hasCredentials: false,
        error: 'שגיאה פנימית בשרת' 
      },
      { status: 500 }
    );
  }
}