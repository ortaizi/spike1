// Environment variables with proper types
export const env = {
  // Supabase (with development defaults)
  NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://dev-placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'dev-anon-key-placeholder',
  SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'dev-service-role-key-placeholder',
  
  // Auth (with development defaults)
  AUTH_SECRET: process.env['AUTH_SECRET'] || 'dev-auth-secret-change-in-production',
  AUTH_DEBUG: process.env['AUTH_DEBUG'] === 'true',
  APP_URL: process.env['APP_URL'] || 'http://localhost:3000',
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'] || '',
  GOOGLE_CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'] || '',
  
  // University Moodle URLs
  BGU_MOODLE_URL: process.env['BGU_MOODLE_URL'] || 'https://moodle.bgu.ac.il',
  TECHNION_MOODLE_URL: process.env['TECHNION_MOODLE_URL'] || 'https://moodle.technion.ac.il',
  HUJI_MOODLE_URL: process.env['HUJI_MOODLE_URL'] || 'https://moodle.huji.ac.il',
  TAU_MOODLE_URL: process.env['TAU_MOODLE_URL'] || 'https://moodle.tau.ac.il',
  
  // Scraping Configuration
  SCRAPING_TIMEOUT: process.env['SCRAPING_TIMEOUT'] || '30000',
  SCRAPING_USER_AGENT: process.env['SCRAPING_USER_AGENT'] || 'Spike-Platform/1.0',
  SCRAPING_RETRY_ATTEMPTS: process.env['SCRAPING_RETRY_ATTEMPTS'] || '3',
  SCRAPING_DELAY: process.env['SCRAPING_DELAY'] || '1000',
  
  // Additional required vars
  COURSE_ANALYZER_API_URL: process.env['COURSE_ANALYZER_API_URL'] || '',
  SYNC_API_URL: process.env['SYNC_API_URL'] || '',
  NEXTAUTH_DEBUG: process.env['NEXTAUTH_DEBUG'] || '',
  SUPABASE_URL: process.env['SUPABASE_URL'] || '',
  SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'] || '',
} as const
