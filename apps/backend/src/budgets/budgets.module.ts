import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { Budget } from '../entities/budget.entity';
import { Receipt } from '../entities/receipt.entity';
import { Category } from '../entities/category.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Budget, Receipt, Category]),
        SupabaseModule,
        CommonModule,
    ],
    controllers: [BudgetsController],
    providers: [BudgetsService],
    exports: [BudgetsService],
})
export class BudgetsModule { }
