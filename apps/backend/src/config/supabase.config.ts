import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  serviceKey: process.env.SUPABASE_SERVICE_KEY!,
};

// Client for server-side operations (uses service key)
export const createSupabaseServiceClient = (): SupabaseClient => {
  if (!supabaseConfig.url || !supabaseConfig.serviceKey) {
    throw new Error('Supabase URL and Service Key must be provided');
  }
  
  return createClient(supabaseConfig.url, supabaseConfig.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Client for user-context operations (uses anon key)
export const createSupabaseAnonClient = (): SupabaseClient => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error('Supabase URL and Anon Key must be provided');
  }
  
  return createClient(supabaseConfig.url, supabaseConfig.anonKey);
}; 