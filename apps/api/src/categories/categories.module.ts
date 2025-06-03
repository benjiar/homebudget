import { Module, forwardRef } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRouter } from './categories.router';
import { DatabaseModule } from '../database/database.module';
import { TrpcModule } from '../trpc/trpc.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => TrpcModule)],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRouter],
  exports: [CategoriesService, CategoriesRouter],
})
export class CategoriesModule {} 