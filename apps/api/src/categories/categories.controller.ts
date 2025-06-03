import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';

@Controller('households/:householdId/categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async createCategory(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Body() data: {
      name: string;
      icon?: string;
      color?: string;
      isDefault?: boolean;
    }
  ) {
    return this.categoriesService.createCategory(userId, householdId, data);
  }

  @Get()
  async getCategories(
    @User('id') userId: string,
    @Param('householdId') householdId: string
  ) {
    return this.categoriesService.getCategories(userId, householdId);
  }

  @Put(':id')
  async updateCategory(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Param('id') categoryId: string,
    @Body() data: {
      name?: string;
      icon?: string;
      color?: string;
      isDefault?: boolean;
    }
  ) {
    return this.categoriesService.updateCategory(userId, categoryId, data);
  }

  @Delete(':id')
  async deleteCategory(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Param('id') categoryId: string
  ) {
    return this.categoriesService.deleteCategory(userId, categoryId);
  }
} 