import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '../../../lib/db';
import { env } from '../../../lib/env';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check if Supabase is available (not using placeholder values)
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let databaseStatus;
    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Using mock health check (Supabase not configured)');
      databaseStatus = {
        success: true,
        status: 'healthy',
        responseTime: '0ms',
        mock: true,
      };
    } else {
      databaseStatus = await checkDatabaseConnection();
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: databaseStatus.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: databaseStatus,
        memory: {
          status: 'healthy',
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`,
        },
      },
      uptime: `${Math.round(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
