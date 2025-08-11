import { createClient } from '@supabase/supabase-js'
import { env } from "../env"

// Create a Supabase client with service role key for admin operations
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to save data with service role (bypasses RLS)
export async function saveWithServiceRole<T>(
  table: string,
  data: T,
  operation: 'insert' | 'update' | 'upsert' = 'insert'
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    let result;
    
    switch (operation) {
      case 'insert':
        result = await supabaseAdmin
          .from(table)
          .insert(data)
          .select();
        break;
      case 'update':
        result = await supabaseAdmin
          .from(table)
          .update(data)
          .select();
        break;
      case 'upsert':
        result = await supabaseAdmin
          .from(table)
          .upsert(data)
          .select();
        break;
    }
    
    if (result.error) {
      console.error(`Error in ${operation} operation:`, result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error(`Unexpected error in ${operation} operation:`, error);
    return {
      success: false,
      error: error
    };
  }
}

// Helper function to get data with service role
export async function getWithServiceRole<T>(
  table: string,
  filters?: Record<string, any>
): Promise<{ success: boolean; data?: T[]; error?: any }> {
  try {
    let query = supabaseAdmin.from(table).select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const result = await query;
    
    if (result.error) {
      console.error('Error in get operation:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
    return {
      success: true,
      data: result.data as T[]
    };
  } catch (error) {
    console.error('Unexpected error in get operation:', error);
    return {
      success: false,
      error: error
    };
  }
} 