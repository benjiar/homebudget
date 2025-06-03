import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HouseholdsModule } from './households/households.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { TrpcModule } from './trpc/trpc.module';
import { SupabaseModule } from './lib/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    DatabaseModule,
    SupabaseModule,
    TrpcModule,
    HouseholdsModule,
    TransactionsModule,
    CategoriesModule,
  ],
})
export class AppModule {}