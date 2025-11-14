import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Receipt } from '../entities/receipt.entity';
import { Category } from '../entities/category.entity';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt, Category]),
    MulterModule.register({
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
    }),
    SupabaseModule,
    CommonModule,
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule { } 