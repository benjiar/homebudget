import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '../entities/user.entity';
import { UpdateUserRequest, UpdatePasswordRequest } from '@homebudget/types';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get('profile')
  async getProfile(@Request() req): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserRequest,
  ): Promise<User> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: UpdatePasswordRequest,
  ): Promise<{ message: string }> {
    try {
      const supabaseClient = this.supabaseService.getServiceClient();
      
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: req.user.email,
        password: changePasswordDto.current_password,
      });

      if (signInError) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Update password using admin API
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        req.user.id,
        { password: changePasswordDto.new_password }
      );

      if (updateError) {
        throw new BadRequestException('Failed to update password: ' + updateError.message);
      }

      return { message: 'Password updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to change password');
    }
  }

  @Delete('account')
  async deleteAccount(@Request() req): Promise<{ message: string }> {
    try {
      // First remove user from our database
      await this.usersService.remove(req.user.id);

      // Then delete from Supabase auth
      const supabaseClient = this.supabaseService.getServiceClient();
      const { error } = await supabaseClient.auth.admin.deleteUser(req.user.id);

      if (error) {
        // Log error but don't fail the request since user is already removed from our DB
        console.error('Failed to delete user from Supabase auth:', error);
      }

      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete account');
    }
  }

  @Get('households')
  async getUserHouseholds(@Request() req): Promise<User> {
    return this.usersService.getUserHouseholds(req.user.id);
  }
} 