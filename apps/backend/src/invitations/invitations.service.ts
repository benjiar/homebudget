import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../supabase/supabase.service';
import { HouseholdsService } from '../households/households.service';
import { Invitation } from '../entities/invitation.entity';
import { User } from '../entities/user.entity';
import { HouseholdRole } from '../entities';
import { InviteMemberRequest } from '@homebudget/types';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private supabaseService: SupabaseService,
    private householdsService: HouseholdsService,
  ) {}

  async inviteMember(
    householdId: string,
    inviteDto: InviteMemberRequest,
    inviterId: string,
  ): Promise<Invitation> {
    // Check if inviter has permission to invite
    const household = await this.householdsService.findOne(householdId);
    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const inviterMembership = household.members?.find(m => m.user_id === inviterId);
    if (!inviterMembership || !this.canInviteMembers(inviterMembership.role)) {
      throw new ForbiddenException('You do not have permission to invite members');
    }

    // Check if user is already a member
    const existingMember = household.members?.find(m => m.user?.email === inviteDto.email);
    if (existingMember) {
      throw new BadRequestException('User is already a member of this household');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationsRepository.findOne({
      where: {
        email: inviteDto.email,
        household_id: householdId,
        is_accepted: false,
      },
    });

    // Check if invitation exists and is not expired
    if (existingInvitation && existingInvitation.expires_at > new Date()) {
      throw new BadRequestException('User already has a pending invitation to this household');
    }

    // Create invitation record
    const invitation = this.invitationsRepository.create({
      email: inviteDto.email,
      household_id: householdId,
      role: inviteDto.role || HouseholdRole.MEMBER,
      invited_by: inviterId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const savedInvitation = await this.invitationsRepository.save(invitation);

    // Send invitation email via Supabase Auth
    try {
      const supabaseClient = this.supabaseService.getServiceClient();
      
      // Create invitation URL with token
      const inviteUrl = `${process.env.FRONTEND_URL}/invite/${savedInvitation.id}`;
      
      // Try to invite existing user or create new user invitation
      const { error } = await supabaseClient.auth.admin.inviteUserByEmail(
        inviteDto.email,
        {
          redirectTo: inviteUrl,
          data: {
            household_id: householdId,
            household_name: household.name,
            invitation_id: savedInvitation.id,
            role: savedInvitation.role,
          }
        }
      );

      if (error) {
        // If Supabase invitation fails, still keep our invitation record
        console.error('Supabase invitation error:', error);
        // We'll continue - user can still accept via direct URL
      }

      return await this.invitationsRepository.findOne({
        where: { id: savedInvitation.id },
        relations: ['household', 'invited_by_user'],
      });
    } catch (error) {
      // If email fails, delete invitation record
      await this.invitationsRepository.delete(savedInvitation.id);
      throw new BadRequestException('Failed to send invitation email');
    }
  }

  async acceptInvitation(invitationId: string, userEmail: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId },
      relations: ['household'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.is_accepted) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.email !== userEmail) {
      throw new ForbiddenException('This invitation is not for your email address');
    }

    // Find or create user
    const user = await this.usersRepository.findOne({ where: { email: userEmail } });
    if (!user) {
      // User will be created by Supabase auth flow
      throw new BadRequestException('User account not found. Please sign up first.');
    }

    // Add user to household
    await this.householdsService.addMember(
      invitation.household_id,
      { userId: user.id, role: invitation.role },
      invitation.invited_by, // Use inviter's ID for permission check
    );

    // Mark invitation as accepted
    invitation.is_accepted = true;
    invitation.accepted_at = new Date();
    await this.invitationsRepository.save(invitation);
  }

  async getHouseholdInvitations(householdId: string, userId: string): Promise<Invitation[]> {
    // Check if user has permission to view invitations
    const household = await this.householdsService.findOne(householdId);
    const userMembership = household.members?.find(m => m.user_id === userId);
    
    if (!userMembership || !this.canManageInvitations(userMembership.role)) {
      throw new ForbiddenException('You do not have permission to view invitations');
    }

    return this.invitationsRepository.find({
      where: { household_id: householdId },
      relations: ['invited_by_user'],
      order: { created_at: 'DESC' },
    });
  }

  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId },
      relations: ['household'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user has permission to cancel (must be inviter or household admin/owner)
    const household = await this.householdsService.findOne(invitation.household_id);
    const userMembership = household.members?.find(m => m.user_id === userId);
    
    const canCancel = invitation.invited_by === userId || 
                     (userMembership && this.canManageInvitations(userMembership.role));

    if (!canCancel) {
      throw new ForbiddenException('You do not have permission to cancel this invitation');
    }

    await this.invitationsRepository.delete(invitationId);
  }

  private canInviteMembers(role: HouseholdRole): boolean {
    return [HouseholdRole.OWNER, HouseholdRole.ADMIN].includes(role);
  }

  private canManageInvitations(role: HouseholdRole): boolean {
    return [HouseholdRole.OWNER, HouseholdRole.ADMIN].includes(role);
  }
} 