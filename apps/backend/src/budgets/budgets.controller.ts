import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto, BudgetFilterDto } from './dto/budget.dto';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';

@Controller('budgets')
@UseGuards(SupabaseAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.create(householdId, createBudgetDto);
  }

  @Get()
  findAll(@Request() req, @Query() filters: BudgetFilterDto) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.findAll(householdId, filters);
  }

  @Get('overview')
  getBudgetOverview(@Request() req, @Query() filters: BudgetFilterDto) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.getBudgetOverview(householdId, filters);
  }

  @Get('suggestions')
  getSuggestions(@Request() req) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.suggestBudgets(householdId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.findOne(id, householdId);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.update(id, householdId, updateBudgetDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const householdId = req.user.activeHouseholdId;
    return this.budgetsService.remove(id, householdId);
  }
}
