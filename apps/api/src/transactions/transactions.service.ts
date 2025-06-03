import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { transactions, categories, households } from '@homebudget/db';
import { eq, and, gte, lte } from 'drizzle-orm';

@Injectable()
export class TransactionsService {
  constructor(private readonly db: DatabaseService) {}

  async createTransaction(
    userId: string,
    householdId: string,
    data: {
      type: 'income' | 'expense';
      amount: number;
      categoryId?: string;
      description?: string;
      date: Date;
      receiptUrl?: string;
      metadata?: {
        tags?: string[];
        location?: string;
        paymentMethod?: string;
      };
    }
  ) {
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

    // Verify category if provided
    if (data.categoryId) {
      const category = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const [transaction] = await this.db
      .insert(transactions)
      .values({
        householdId,
        userId,
        ...data,
      })
      .returning();

    return transaction;
  }

  async getTransactions(
    userId: string,
    householdId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: 'income' | 'expense';
      categoryId?: string;
    }
  ) {
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

    // Build query conditions
    const conditions = [eq(transactions.householdId, householdId)];

    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }

    const transactionsList = await this.db.query.transactions.findMany({
      where: and(...conditions),
      with: {
        category: true,
        user: true,
      },
      orderBy: (transactions, { desc }) => [desc(transactions.date)],
    });

    return transactionsList;
  }

  async getTransaction(userId: string, transactionId: string) {
    const transaction = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: {
        category: true,
        user: true,
        household: {
          with: {
            members: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify household membership
    const isMember = transaction.household.members.some(
      (member) => member.userId === userId
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this household');
    }

    return transaction;
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    data: {
      type?: 'income' | 'expense';
      amount?: number;
      categoryId?: string;
      description?: string;
      date?: Date;
      receiptUrl?: string;
      metadata?: {
        tags?: string[];
        location?: string;
        paymentMethod?: string;
      };
    }
  ) {
    const transaction = await this.getTransaction(userId, transactionId);

    // Only allow the creator to update the transaction
    if (transaction.userId !== userId) {
      throw new ForbiddenException('You can only update your own transactions');
    }

    // Verify category if provided
    if (data.categoryId) {
      const category = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const [updated] = await this.db
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    return updated;
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await this.getTransaction(userId, transactionId);

    // Only allow the creator to delete the transaction
    if (transaction.userId !== userId) {
      throw new ForbiddenException('You can only delete your own transactions');
    }

    const [deleted] = await this.db
      .delete(transactions)
      .where(eq(transactions.id, transactionId))
      .returning();

    return deleted;
  }

  async getTransactionStats(userId: string, householdId: string) {
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

    const transactionsList = await this.getTransactions(userId, householdId);

    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      byCategory: new Map<string, { income: number; expenses: number }>(),
    };

    const byCategoryMap = new Map<string, { categoryId: string, category: any, total: number }>();

    transactionsList.forEach((transaction) => {
      const amount = Number(transaction.amount);
      const categoryId = transaction.categoryId || 'uncategorized';
      const category = transaction.category || null;
      const prev = byCategoryMap.get(categoryId) || { categoryId, category, total: 0 };
      prev.total += amount;
      byCategoryMap.set(categoryId, prev);
      if (transaction.type === 'income') {
        stats.totalIncome += amount;
      } else {
        stats.totalExpenses += amount;
      }
    });

    return {
      totalIncome: stats.totalIncome,
      totalExpenses: stats.totalExpenses,
      balance: stats.totalIncome - stats.totalExpenses,
      byCategory: Array.from(byCategoryMap.values()),
    };
  }
} 