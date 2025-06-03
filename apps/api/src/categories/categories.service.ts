import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { categories, households } from '@homebudget/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async createCategory(
    userId: string,
    householdId: string,
    data: {
      name: string;
      icon?: string;
      color?: string;
      isDefault?: boolean;
    }
  ) {
    // Verify household membership and ownership
    const household = await this.db.query.households.findFirst({
      where: eq(households.id, householdId),
      with: {
        members: true,
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const isOwner = household.members.some(
      (member) => member.userId === userId && member.role === 'owner'
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the household owner can create categories');
    }

    const [category] = await this.db
      .insert(categories)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return category;
  }

  async getCategories(userId: string, householdId: string) {
    // Verify household membership
    const household = await this.db.query.households.findFirst({
      where: eq(households.id, householdId),
      with: {
        members: true,
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const isMember = household.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this household');
    }

    const categoriesList = await this.db.query.categories.findMany({
      where: eq(categories.householdId, householdId),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });

    return categoriesList;
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      isDefault?: boolean;
    }
  ) {
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: {
        household: {
          with: {
            members: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify household ownership
    const isOwner = category.household.members.some(
      (member) => member.userId === userId && member.role === 'owner'
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the household owner can update categories');
    }

    const [updated] = await this.db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return updated;
  }

  async deleteCategory(userId: string, categoryId: string) {
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: {
        household: {
          with: {
            members: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify household ownership
    const isOwner = category.household.members.some(
      (member) => member.userId === userId && member.role === 'owner'
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the household owner can delete categories');
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      throw new ForbiddenException('Cannot delete default categories');
    }

    const [deleted] = await this.db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    return deleted;
  }
} 