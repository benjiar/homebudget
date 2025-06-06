import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { HouseholdMember, HouseholdRole } from '../entities';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  monthly_budget?: number;
  household_id: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  monthly_budget?: number;
  is_active?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(HouseholdMember)
    private householdMembersRepository: Repository<HouseholdMember>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    // Check if user has permission to create categories in this household
    await this.checkUserPermission(createCategoryDto.household_id, userId, [
      HouseholdRole.OWNER,
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const category = this.categoriesRepository.create(createCategoryDto);
    return await this.categoriesRepository.save(category);
  }

  async findByHousehold(householdId: string, includeInactive = false): Promise<Category[]> {
    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.household_id = :householdId', { householdId })
      .leftJoinAndSelect('category.receipts', 'receipts')
      .orderBy('category.name', 'ASC');

    if (!includeInactive) {
      queryBuilder.andWhere('category.is_active = true');
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['household', 'receipts'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    const category = await this.findOne(id);

    // Check if user has permission to update categories in this household
    await this.checkUserPermission(category.household_id, userId, [
      HouseholdRole.OWNER,
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    // System categories can't be deleted or have their name changed
    if (category.is_system && (updateCategoryDto.name || updateCategoryDto.is_active === false)) {
      throw new ForbiddenException('Cannot modify or deactivate system categories');
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoriesRepository.save(category);
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if user has permission to delete categories in this household
    await this.checkUserPermission(category.household_id, userId, [
      HouseholdRole.OWNER,
      HouseholdRole.ADMIN,
    ]);

    // Can't delete system categories
    if (category.is_system) {
      throw new ForbiddenException('Cannot delete system categories');
    }

    // Check if category has receipts
    if (category.receipts && category.receipts.length > 0) {
      throw new ForbiddenException('Cannot delete category that has receipts. Archive it instead.');
    }

    await this.categoriesRepository.remove(category);
  }

  async setBudget(id: string, monthly_budget: number, userId: string): Promise<Category> {
    const category = await this.findOne(id);

    // Check if user has permission to set budgets
    await this.checkUserPermission(category.household_id, userId, [
      HouseholdRole.OWNER,
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    category.monthly_budget = monthly_budget;
    return await this.categoriesRepository.save(category);
  }

  async getCategorySpending(categoryId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoin('category.receipts', 'receipt')
      .select('SUM(receipt.amount)', 'total')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('receipt.receipt_date >= :startDate', { startDate })
      .andWhere('receipt.receipt_date <= :endDate', { endDate })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getHouseholdBudgetOverview(householdId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const categories = await this.findByHousehold(householdId);
    
    const budgetOverview = await Promise.all(
      categories.map(async (category) => {
        const spent = await this.getCategorySpending(category.id, startDate, endDate);
        return {
          category: category,
          budget: category.monthly_budget || 0,
          spent: spent,
          remaining: (category.monthly_budget || 0) - spent,
          percentage: category.monthly_budget ? (spent / category.monthly_budget) * 100 : 0,
        };
      })
    );

    const totalBudget = budgetOverview.reduce((sum, item) => sum + item.budget, 0);
    const totalSpent = budgetOverview.reduce((sum, item) => sum + item.spent, 0);

    return {
      categories: budgetOverview,
      summary: {
        total_budget: totalBudget,
        total_spent: totalSpent,
        total_remaining: totalBudget - totalSpent,
        overall_percentage: totalBudget ? (totalSpent / totalBudget) * 100 : 0,
      },
    };
  }

  private async checkUserPermission(
    householdId: string,
    userId: string,
    allowedRoles: HouseholdRole[]
  ): Promise<void> {
    const membership = await this.householdMembersRepository.findOne({
      where: {
        user_id: userId,
        household_id: householdId,
        is_active: true,
      },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions for this operation');
    }
  }
} 