import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Supabase URL not found. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your .env file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Supabase Anon Key not found. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your .env file.'
  );
}

// Create a single Supabase client for interacting with your database
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
