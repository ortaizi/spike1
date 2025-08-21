import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unifiedAuthOptions } from '../../../../lib/auth/unified-auth';
import { supabase } from '../../../../lib/db';
import { extractDataFromEmail } from '../../../../lib/university-utils';
import { z } from 'zod';

// Validation schema for onboarding data
const onboardingSchema = z.object({
  onboardingCompleted: z.boolean().default(true)
});

// Validation schema for university credentials update
const universityCredentialsSchema = z.object({
  universityCredentialsSaved: z.boolean().optional(),
  university: z.string().optional(),
  lastCredentialsUpdate: z.string().optional()
});

export async function GET() {
  try {
    // Get session using NextAuth
    const session = await getServerSession(unifiedAuthOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    console.log(`🔍 Checking onboarding status for: ${session.user.email}`);
    console.log(`🔍 Debug - session.user:`, JSON.stringify(session.user, null, 2));

    // Extract university info from email
    const emailData = extractDataFromEmail(session.user.email);
    
    if (!emailData.isValidUniversityEmail || !emailData.university) {
      return NextResponse.json({
        onboardingCompleted: false,
        error: 'כתובת האימייל לא שייכת לאוניברסיטה נתמכת',
        userInfo: {
          email: session.user.email,
          universitySupported: false
        }
      });
    }

    // Check user's onboarding status from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, is_setup_complete, university_id, preferences')
      .eq('email', session.user.email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json(
        { error: 'שגיאה בטעינת נתוני משתמש' },
        { status: 500 }
      );
    }
    
    console.log(`🔍 Debug - Raw user query result:`, JSON.stringify(user, null, 2));
    console.log(`🔍 Debug - User error:`, userError);

    // Check credential status in user_credentials table
    let hasValidCredentials = false;
    let needsRevalidation = true;
    
    if (user) {
      // Check if user has credentials in the user_credentials table
      const { data: credentials, error: credError } = await supabase
        .from('user_credentials')
        .select('username, encrypted_password, university_id, is_active, last_validated_at')
        .eq('user_email', session.user.email)
        .eq('university_id', emailData.university.id)
        .single();
      
      if (credentials && !credError && credentials.is_active) {
        hasValidCredentials = true;
        
        // Check if credentials need revalidation (older than 30 days)
        if (credentials.last_validated_at) {
          const lastValidated = new Date(credentials.last_validated_at);
          const daysSince = (new Date().getTime() - lastValidated.getTime()) / (1000 * 60 * 60 * 24);
          needsRevalidation = daysSince > 30;
          
          console.log(`🔍 Found credentials in user_credentials table - last validated: ${daysSince.toFixed(1)} days ago`);
        } else {
          console.log('🔍 Found credentials but no last validation date - needs revalidation');
        }
      } else {
        console.log('🔍 No credentials found in user_credentials table:', credError?.message || 'No active credentials');
      }
    }

    const onboardingCompleted = user?.is_setup_complete && hasValidCredentials && !needsRevalidation;

    console.log(`📊 Onboarding status: ${onboardingCompleted ? 'Complete' : 'Incomplete'}`);
    console.log(`🔍 Debug - setup: ${user?.is_setup_complete}, creds: ${hasValidCredentials}, revalidate: ${needsRevalidation}`);
    console.log(`🔍 Debug - user.university_id: ${user?.university_id}, emailData.university.id: ${emailData.university.id}`);

    return NextResponse.json({
      onboardingCompleted,
      userInfo: {
        email: session.user.email,
        name: session.user.name,
        university: emailData.university.nameHe,
        universityId: emailData.university.id,
        username: emailData.username,
        universitySupported: true,
        hasValidCredentials,
        needsRevalidation,
        setupComplete: user?.is_setup_complete || false
      }
    });

  } catch (error) {
    console.error('❌ Onboarding status check error:', error);
    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(unifiedAuthOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    console.log(`📝 Completing onboarding for: ${session.user.email}`);

    // Extract university info from email
    const emailData = extractDataFromEmail(session.user.email);
    
    if (!emailData.isValidUniversityEmail || !emailData.university) {
      return NextResponse.json(
        { 
          success: false,
          error: 'כתובת האימייל לא שייכת לאוניברסיטה נתמכת' 
        },
        { status: 400 }
      );
    }

    // Verify credentials exist and are valid
    const { data: credentialStatus } = await supabase.rpc('get_user_credential_status', {
      user_email_param: session.user.email,
      university_id_param: emailData.university.id
    });

    if (!credentialStatus?.has_credentials || credentialStatus.needs_revalidation) {
      return NextResponse.json(
        { 
          success: false,
          error: 'יש להזין ולאמת את נתוני האוניברסיטה תחילה' 
        },
        { status: 400 }
      );
    }

    // Update or create user record
    const { data: updatedUser, error } = await supabase
      .from('users')
      .upsert({
        email: session.user.email,
        name: session.user.name,
        google_id: session.user.id,
        university_id: emailData.university.id,
        is_setup_complete: validatedData.onboardingCompleted,
        preferences: {
          onboardingCompleted: validatedData.onboardingCompleted,
          universityCredentialsSaved: true,
          lastCredentialsUpdate: new Date().toISOString()
        }
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'שגיאה בעדכון המשתמש' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Onboarding completed successfully');

    return NextResponse.json({
      success: true,
      message: 'ברוכים הבאים ל-Spike! החשבון שלך מוכן לשימוש',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        university: emailData.university.nameHe,
        universityId: emailData.university.id,
        username: emailData.username,
        onboardingCompleted: true,
        preferences: updatedUser.preferences
      }
    });

  } catch (error) {
    console.error('❌ Onboarding API error:', error);
    
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

export async function PATCH(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(unifiedAuthOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'לא מורשה' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = universityCredentialsSchema.parse(body);

    // Check if Supabase is available (not using placeholder values)
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Using mock university credentials update (Supabase not configured)');
      return NextResponse.json({
        success: true,
        message: 'פרטי האוניברסיטה עודכנו בהצלחה',
        user: {
          id: 'mock_user_id',
          email: session.user.email,
          name: session.user.name,
          universityCredentialsSaved: validatedData.universityCredentialsSaved,
          university: validatedData.university,
          lastCredentialsUpdate: validatedData.lastCredentialsUpdate
        }
      });
    }

    // Update user's university credentials status
    const updateData: any = {};
    
    if (validatedData.universityCredentialsSaved !== undefined) {
      updateData.university_credentials_saved = validatedData.universityCredentialsSaved;
    }
    
    if (validatedData.university) {
      updateData.university = validatedData.university;
    }
    
    if (validatedData.lastCredentialsUpdate) {
      updateData.last_credentials_update = validatedData.lastCredentialsUpdate;
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('google_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user university credentials:', error);
      return NextResponse.json(
        { error: 'שגיאה בעדכון פרטי האוניברסיטה' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'פרטי האוניברסיטה עודכנו בהצלחה',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        universityCredentialsSaved: updatedUser.university_credentials_saved,
        university: updatedUser.university,
        lastCredentialsUpdate: updatedUser.last_credentials_update
      }
    });

  } catch (error) {
    console.error('University credentials update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'נתונים לא תקינים',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
} 