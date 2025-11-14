import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
import { Receipt } from '../entities/receipt.entity';
import { Category } from '../entities/category.entity';
import { CreateBudgetDto, UpdateBudgetDto, BudgetFilterDto } from './dto/budget.dto';

export interface BudgetOverviewItem {
  budget: Budget;
  current_spending: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
  days_remaining: number;
  days_elapsed: number;
  average_daily_spending: number;
  projected_spending: number;
  on_track: boolean;
}

export interface BudgetSummary {
  total_budgets: number;
  total_budget_amount: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage: number;
  over_budget_count: number;
  budgets: BudgetOverviewItem[];
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetsRepository: Repository<Budget>,
    @InjectRepository(Receipt)
    private receiptsRepository: Repository<Receipt>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(householdId: string, createBudgetDto: CreateBudgetDto): Promise<Budget> {
    // Validate dates
    const startDate = new Date(createBudgetDto.start_date);
    const endDate = new Date(createBudgetDto.end_date);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate category exists if provided
    if (createBudgetDto.category_id) {
      const category = await this.categoriesRepository.findOne({
        where: { id: createBudgetDto.category_id, household_id: householdId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check for overlapping budgets
    const overlapping = await this.findOverlappingBudgets(
      householdId,
      startDate,
      endDate,
      createBudgetDto.category_id,
    );

    if (overlapping.length > 0) {
      throw new BadRequestException(
        'A budget already exists for this category in the specified date range',
      );
    }

    const budget = this.budgetsRepository.create({
      ...createBudgetDto,
      household_id: householdId,
    });

    return this.budgetsRepository.save(budget);
  }

  async findAll(householdId: string, filters?: BudgetFilterDto): Promise<Budget[]> {
    const query = this.budgetsRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .where('budget.household_id = :householdId', { householdId });

    if (filters?.period) {
      query.andWhere('budget.period = :period', { period: filters.period });
    }

    if (filters?.category_id) {
      query.andWhere('budget.category_id = :categoryId', { categoryId: filters.category_id });
    }

    if (filters?.start_date) {
      query.andWhere('budget.end_date >= :startDate', { startDate: filters.start_date });
    }

    if (filters?.end_date) {
      query.andWhere('budget.start_date <= :endDate', { endDate: filters.end_date });
    }

    if (filters?.is_active !== undefined) {
      query.andWhere('budget.is_active = :isActive', { isActive: filters.is_active });
    } else if (!filters?.include_inactive) {
      query.andWhere('budget.is_active = true');
    }

    query.orderBy('budget.start_date', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, householdId: string): Promise<Budget> {
    const budget = await this.budgetsRepository.findOne({
      where: { id, household_id: householdId },
      relations: ['category'],
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, householdId: string, updateBudgetDto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id, householdId);

    // Validate dates if both are being updated
    if (updateBudgetDto.start_date || updateBudgetDto.end_date) {
      const startDate = new Date(updateBudgetDto.start_date || budget.start_date);
      const endDate = new Date(updateBudgetDto.end_date || budget.end_date);

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate category if being updated
    if (updateBudgetDto.category_id) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateBudgetDto.category_id, household_id: householdId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    Object.assign(budget, updateBudgetDto);
    return this.budgetsRepository.save(budget);
  }

  async remove(id: string, householdId: string): Promise<void> {
    const budget = await this.findOne(id, householdId);
    await this.budgetsRepository.remove(budget);
  }

  async getBudgetOverview(householdId: string, filters?: BudgetFilterDto): Promise<BudgetSummary> {
    const budgets = await this.findAll(householdId, filters);
    const today = new Date();

    const budgetItems: BudgetOverviewItem[] = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await this.calculateSpending(
          householdId,
          new Date(budget.start_date),
          new Date(budget.end_date),
          budget.category_id,
        );

        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        
        const remaining = budget.amount - spending;
        const percentageUsed = (spending / budget.amount) * 100;
        const averageDailySpending = daysElapsed > 0 ? spending / daysElapsed : 0;
        const projectedSpending = averageDailySpending * totalDays;
        const onTrack = projectedSpending <= budget.amount;

        return {
          budget,
          current_spending: spending,
          remaining,
          percentage_used: percentageUsed,
          is_over_budget: spending > budget.amount,
          days_remaining: daysRemaining,
          days_elapsed: daysElapsed,
          average_daily_spending: averageDailySpending,
          projected_spending: projectedSpending,
          on_track: onTrack,
        };
      }),
    );

    const totalBudgetAmount = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalSpent = budgetItems.reduce((sum, item) => sum + item.current_spending, 0);
    const totalRemaining = totalBudgetAmount - totalSpent;
    const overBudgetCount = budgetItems.filter(item => item.is_over_budget).length;

    return {
      total_budgets: budgets.length,
      total_budget_amount: totalBudgetAmount,
      total_spent: totalSpent,
      total_remaining: totalRemaining,
      overall_percentage: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0,
      over_budget_count: overBudgetCount,
      budgets: budgetItems,
    };
  }

  async suggestBudgets(householdId: string): Promise<any[]> {
    // Get all categories for the household
    const categories = await this.categoriesRepository.find({
      where: { household_id: householdId, is_active: true },
    });

    const suggestions = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    for (const category of categories) {
      // Calculate average spending over last 3 months
      const spending = await this.receiptsRepository
        .createQueryBuilder('receipt')
        .where('receipt.household_id = :householdId', { householdId })
        .andWhere('receipt.category_id = :categoryId', { categoryId: category.id })
        .andWhere('receipt.receipt_date >= :startDate', { startDate: threeMonthsAgo.toISOString().split('T')[0] })
        .select('SUM(receipt.amount)', 'total')
        .getRawOne();

      const totalSpending = Number(spending?.total || 0);
      
      if (totalSpending > 0) {
        const averageMonthly = totalSpending / 3;
        const suggestedMonthly = Math.ceil(averageMonthly * 1.1); // Add 10% buffer
        const suggestedYearly = suggestedMonthly * 12;

        suggestions.push({
          category,
          historical_spending: {
            last_3_months: totalSpending,
            average_monthly: averageMonthly,
          },
          suggestions: {
            monthly: suggestedMonthly,
            yearly: suggestedYearly,
          },
        });
      }
    }

    return suggestions.sort((a, b) => b.historical_spending.average_monthly - a.historical_spending.average_monthly);
  }

  private async calculateSpending(
    householdId: string,
    startDate: Date,
    endDate: Date,
    categoryId?: string,
  ): Promise<number> {
    const query = this.receiptsRepository
      .createQueryBuilder('receipt')
      .where('receipt.household_id = :householdId', { householdId })
      .andWhere('receipt.receipt_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

    if (categoryId) {
      query.andWhere('receipt.category_id = :categoryId', { categoryId });
    }

    const result = await query.select('SUM(receipt.amount)', 'total').getRawOne();
    return Number(result?.total || 0);
  }

  private async findOverlappingBudgets(
    householdId: string,
    startDate: Date,
    endDate: Date,
    categoryId?: string,
  ): Promise<Budget[]> {
    const query = this.budgetsRepository
      .createQueryBuilder('budget')
      .where('budget.household_id = :householdId', { householdId })
      .andWhere('budget.is_active = true')
      .andWhere(
        '(budget.start_date BETWEEN :startDate AND :endDate OR budget.end_date BETWEEN :startDate AND :endDate OR (:startDate BETWEEN budget.start_date AND budget.end_date))',
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      );

    if (categoryId) {
      query.andWhere('budget.category_id = :categoryId', { categoryId });
    } else {
      query.andWhere('budget.category_id IS NULL');
    }

    return query.getMany();
  }
}
