import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from '../entities/invitation.entity';
import { User } from '../entities/user.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { HouseholdsModule } from '../households/households.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User]),
    SupabaseModule,
    HouseholdsModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {} 