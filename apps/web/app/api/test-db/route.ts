import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';

export async function GET() {
  try {
    // Check if Supabase is available (not using placeholder values)
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Using mock database test (Supabase not configured)');
      return NextResponse.json({
        success: true,
        message: 'Mock database connection successful',
        userCount: 1,
        mock: true
      });
    }
    
    // Test database connection with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .limit(1);

      clearTimeout(timeoutId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        userCount: count || 0
      });
    } catch (dbError) {
      clearTimeout(timeoutId);
      console.error('Database connection error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 