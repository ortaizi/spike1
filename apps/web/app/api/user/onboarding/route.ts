import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unifiedAuthOptions } from '../../../../lib/auth/unified-auth';
import { supabase } from '../../../../lib/db';
import { z } from 'zod';
import { env } from "../../../../lib/env"

// Validation schema for onboarding data
const onboardingSchema = z.object({
  onboardingCompleted: z.boolean().default(true)
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

    // Check if Supabase is available (not using placeholder values)
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Using mock onboarding status (Supabase not configured)');
      return NextResponse.json({
        onboardingCompleted: false
      });
    }

    // Get user's onboarding status
    const { data: user, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('email', session.user.email)
      .single();

    if (error || !user) {
      console.log('User not found in database, using mock onboarding status');
      return NextResponse.json({
        onboardingCompleted: false
      });
    }

    const preferences = user.preferences as any;
    const onboardingCompleted = preferences?.onboardingCompleted ?? false;

    return NextResponse.json({
      onboardingCompleted
    });

  } catch (error) {
    console.error('Onboarding status check error:', error);
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

    // Check if Supabase is available (not using placeholder values)
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Using mock onboarding completion (Supabase not configured)');
      return NextResponse.json({
        success: true,
        message: 'הפרופיל עודכן בהצלחה',
        user: {
          id: 'mock_user_id',
          email: session.user.email,
          name: session.user.name,
          preferences: {
            onboardingCompleted: validatedData.onboardingCompleted
          }
        }
      });
    }

    // Mark user as onboarded
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        preferences: {
          onboardingCompleted: validatedData.onboardingCompleted
        },
        updatedAt: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'שגיאה בעדכון המשתמש' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'הפרופיל עודכן בהצלחה',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        faculty: updatedUser.faculty,
        department: updatedUser.department,
        yearOfStudy: updatedUser.yearOfStudy,
        preferences: updatedUser.preferences
      }
    });

  } catch (error) {
    console.error('Onboarding API error:', error);
    
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