import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'benji',
      process.env.SUPABASE_SERVICE_KEY || 'benji'
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
} 