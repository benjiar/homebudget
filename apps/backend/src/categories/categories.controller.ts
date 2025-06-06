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
  DefaultValuePipe
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { CategoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';
import { Category } from '../entities/category.entity';

@Controller('categories')
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req: any): Promise<Category> {
    return this.categoriesService.create(createCategoryDto, req.user.id);
  }

  @Get('household/:householdId')
  async findByHousehold(
    @Param('householdId') householdId: string,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive: boolean,
  ): Promise<Category[]> {
    return this.categoriesService.findByHousehold(householdId, includeInactive);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
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

  @Get('household/:householdId/budget-overview')
  async getBudgetOverview(
    @Param('householdId') householdId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.categoriesService.getHouseholdBudgetOverview(
      householdId, 
      month || new Date().getMonth() + 1, 
      year || new Date().getFullYear()
    );
  }
} 