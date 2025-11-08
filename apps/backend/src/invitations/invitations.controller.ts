import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UsersService } from '../users/users.service';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { Invitation } from '../entities/invitation.entity';
import { InviteMemberRequest } from '@homebudget/types';
import { HouseholdHeader } from '../common/decorators/household-header.decorator';

@Controller('invitations')
@UseGuards(SupabaseAuthGuard)
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly usersService: UsersService,
  ) { }

  @Post('invite')
  async inviteMember(
    @Request() req,
    @Body() inviteDto: InviteMemberRequest & { householdId: string },
  ): Promise<Invitation> {
    return this.invitationsService.inviteMember(inviteDto.householdId, inviteDto, req.user.id);
  }

  @Post(':invitationId/accept')
  async acceptInvitation(
    @Param('invitationId') invitationId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    // Ensure user exists in database (creates if doesn't exist)
    await this.usersService.ensureUserExists(req.user);
    await this.invitationsService.acceptInvitation(invitationId, req.user.email);
    return { message: 'Invitation accepted successfully' };
  }

  @Get()
  async getHouseholdInvitations(
    @HouseholdHeader() householdIds: string[],
    @Request() req,
  ): Promise<Invitation[]> {
    return this.invitationsService.getHouseholdInvitationsMultiple(householdIds, req.user.id);
  }

  @Delete(':invitationId')
  async cancelInvitation(
    @Param('invitationId') invitationId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.invitationsService.cancelInvitation(invitationId, req.user.id);
    return { message: 'Invitation cancelled successfully' };
  }
} 