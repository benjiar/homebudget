import { Module, forwardRef } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsRouter } from './transactions.router';
import { DatabaseModule } from '../database/database.module';
import { TrpcModule } from '../trpc/trpc.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => TrpcModule)],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRouter],
  exports: [TransactionsService, TransactionsRouter],
})
export class TransactionsModule {} 