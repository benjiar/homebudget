import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL || 'benji',
  process.env.SUPABASE_SERVICE_KEY || 'benji'
); 