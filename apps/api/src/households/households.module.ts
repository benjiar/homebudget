import { Module } from '@nestjs/common';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { DatabaseModule } from '../database/database.module';
import { HouseholdsRouter } from './households.router';
import { TrpcModule } from '../trpc/trpc.module';

@Module({
  imports: [DatabaseModule, TrpcModule],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, HouseholdsRouter],
  exports: [HouseholdsService, HouseholdsRouter],
})
export class HouseholdsModule {} 