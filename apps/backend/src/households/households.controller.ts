import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { Household } from '../entities/household.entity';
import { HouseholdMember } from '../entities/household-member.entity';
import {
  CreateHouseholdRequest,
  UpdateHouseholdRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
} from '@homebudget/types';

@Controller('households')
@UseGuards(SupabaseAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  async create(
    @Request() req,
    @Body() createHouseholdDto: CreateHouseholdRequest,
  ): Promise<Household> {
    return this.householdsService.create(createHouseholdDto, req.user.id, req.user);
  }

  @Get()
  async findUserHouseholds(@Request() req): Promise<Household[]> {
    return this.householdsService.findUserHouseholds(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Household> {
    return this.householdsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateHouseholdDto: UpdateHouseholdRequest,
  ): Promise<Household> {
    return this.householdsService.update(id, updateHouseholdDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.householdsService.remove(id, req.user.id);
    return { message: 'Household deleted successfully' };
  }

  // Member management endpoints
  @Post(':id/members')
  async addMember(
    @Param('id') householdId: string,
    @Request() req,
    @Body() addMemberDto: AddMemberRequest,
  ): Promise<HouseholdMember> {
    return this.householdsService.addMember(
      householdId,
      { userId: addMemberDto.userId, role: addMemberDto.role },
      req.user.id
    );
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') householdId: string,
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.householdsService.removeMember(householdId, userId, req.user.id);
    return { message: 'Member removed successfully' };
  }

  @Patch(':id/members/:userId/role')
  async updateMemberRole(
    @Param('id') householdId: string,
    @Param('userId') userId: string,
    @Request() req,
    @Body() updateRoleDto: UpdateMemberRoleRequest,
  ): Promise<HouseholdMember> {
    return this.householdsService.updateMemberRole(
      householdId,
      userId,
      updateRoleDto.role,
      req.user.id
    );
  }

  @Post(':id/leave')
  async leaveHousehold(
    @Param('id') householdId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    // Users can always leave a household (except owners)
    await this.householdsService.removeMember(householdId, req.user.id, req.user.id);
    return { message: 'Left household successfully' };
  }
} 