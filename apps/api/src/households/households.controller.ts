import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import type { CreateHouseholdInput, UpdateHouseholdInput } from './types';
import { HouseholdsService } from './households.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';

@Controller('households')
@UseGuards(AuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  async createHousehold(
    @User('id') userId: string,
    @Body() data: CreateHouseholdInput,
  ) {
    return this.householdsService.createHousehold(userId, data);
  }

  @Get()
  async getUserHouseholds(@User('id') userId: string) {
    return this.householdsService.getUserHouseholds(userId);
  }

  @Get(':id')
  async getHousehold(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.householdsService.getHousehold(userId, id);
  }

  @Put(':id')
  async updateHousehold(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() data: UpdateHouseholdInput,
  ) {
    return this.householdsService.updateHousehold(userId, id, data);
  }

  @Post(':id/invite')
  async inviteMember(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    return this.householdsService.inviteMember(userId, id, email);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @User('id') userId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.householdsService.removeMember(userId, id, memberId);
  }

  @Delete(':id/leave')
  async leaveHousehold(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.householdsService.leaveHousehold(userId, id);
  }
} 