import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from '../entities/household.entity';
import { HouseholdMember } from '../entities/household-member.entity';
import { User } from '../entities/user.entity';
import { HouseholdsService } from './households.service';
import { HouseholdsController } from './households.controller';
import { HouseholdCacheService } from './household-cache.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Household, HouseholdMember, User]), SupabaseModule, UsersModule],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, HouseholdCacheService],
  exports: [HouseholdsService],
})
export class HouseholdsModule { } 