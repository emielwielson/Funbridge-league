import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Create Supabase client for client-side usage
// This uses the anon key and respects RLS policies
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Use session pooling if available
  // Session pooling connection string should be configured in Supabase project settings
  // and accessed via NEXT_PUBLIC_SUPABASE_URL if it points to the pooled endpoint
});

// Server-side Supabase client (for use in API routes, server components, etc.)
// This uses the service role key and bypasses RLS (use with caution)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This is required for server-side operations.'
    );
  }

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Helper to get Supabase client based on context (client vs server)
export function getSupabaseClient() {
  // In browser/client context, use the regular client
  if (typeof window !== 'undefined') {
    return supabase;
  }
  
  // In server context, use service role client
  return createServerClient();
}

