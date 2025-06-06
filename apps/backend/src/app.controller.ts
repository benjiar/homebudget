import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    try {
      // Test Supabase connection
      const supabaseClient = this.supabaseService.getServiceClient();
      const { error } = await supabaseClient
        .from('pg_stat_database')
        .select('datname')
        .limit(1);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: !error,
          message: error ? error.message : 'Connected to Supabase PostgreSQL',
        },
        supabase: {
          configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
          url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 20)}...` : 'Not configured',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
