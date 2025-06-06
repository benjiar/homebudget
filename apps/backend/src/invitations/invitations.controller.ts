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
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { Invitation } from '../entities/invitation.entity';
import { InviteMemberRequest } from '@homebudget/types';

@Controller('invitations')
@UseGuards(SupabaseAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('household/:householdId/invite')
  async inviteMember(
    @Param('householdId') householdId: string,
    @Request() req,
    @Body() inviteDto: InviteMemberRequest,
  ): Promise<Invitation> {
    return this.invitationsService.inviteMember(householdId, inviteDto, req.user.id);
  }

  @Post(':invitationId/accept')
  async acceptInvitation(
    @Param('invitationId') invitationId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.invitationsService.acceptInvitation(invitationId, req.user.email);
    return { message: 'Invitation accepted successfully' };
  }

  @Get('household/:householdId')
  async getHouseholdInvitations(
    @Param('householdId') householdId: string,
    @Request() req,
  ): Promise<Invitation[]> {
    return this.invitationsService.getHouseholdInvitations(householdId, req.user.id);
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