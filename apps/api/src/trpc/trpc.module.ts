import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { TransactionsModule } from '../transactions/transactions.module';
import { CategoriesModule } from '../categories/categories.module';
import { SupabaseModule } from '../lib/supabase.module';

@Module({
  imports: [
    TransactionsModule,
    CategoriesModule,
    SupabaseModule,
  ],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService],
})
export class TrpcModule {} 