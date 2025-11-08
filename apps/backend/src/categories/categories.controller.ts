import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { CategoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';
import { Category } from '../entities/category.entity';
import { HouseholdHeader } from '../common/decorators/household-header.decorator';

@Controller('categories')
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req: any): Promise<Category> {
    return this.categoriesService.create(createCategoryDto, req.user.id);
  }

  @Get('budget-overview')
  async getBudgetOverview(
    @HouseholdHeader() householdIds: string[],
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) month: number,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Request() req: any
  ) {
    return this.categoriesService.getHouseholdBudgetOverviewMultiple(householdIds, month, year, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Get()
  async findByHouseholds(
    @HouseholdHeader() householdIds: string[],
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive: boolean,
    @Request() req: any
  ): Promise<Category[]> {
    return this.categoriesService.findByHouseholdIds(householdIds, includeInactive, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: any
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.categoriesService.remove(id, req.user.id);
  }

  @Patch(':id/budget')
  async setBudget(
    @Param('id') id: string,
    @Body('monthly_budget') monthlyBudget: number,
    @Request() req: any
  ): Promise<Category> {
    return this.categoriesService.setBudget(id, monthlyBudget, req.user.id);
  }
} 