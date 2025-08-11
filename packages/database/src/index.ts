// Database package for Spike Platform
// Using Supabase client

export { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const supabaseConfig = {
  url: process.env['SUPABASE_URL'] || '',
  anonKey: process.env['SUPABASE_ANON_KEY'] || '',
  serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
};

// Create a Supabase client helper
export function createSupabaseClient(serviceRole = false) {
  const { createClient } = require('@supabase/supabase-js');
  
  return createClient(
    supabaseConfig.url,
    serviceRole ? supabaseConfig.serviceRoleKey : supabaseConfig.anonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}

// Database connection helper
export const db = createSupabaseClient();