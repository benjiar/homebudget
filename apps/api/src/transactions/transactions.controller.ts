import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';

@Controller('households/:householdId/transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Body() data: {
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
    return this.transactionsService.createTransaction(userId, householdId, data);
  }

  @Get()
  async getTransactions(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Query() filters: {
      startDate?: string;
      endDate?: string;
      type?: 'income' | 'expense';
      categoryId?: string;
    }
  ) {
    return this.transactionsService.getTransactions(userId, householdId, {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });
  }

  @Get('stats')
  async getTransactionStats(
    @User('id') userId: string,
    @Param('householdId') householdId: string
  ) {
    return this.transactionsService.getTransactionStats(userId, householdId);
  }

  @Get(':id')
  async getTransaction(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Param('id') transactionId: string
  ) {
    return this.transactionsService.getTransaction(userId, transactionId);
  }

  @Put(':id')
  async updateTransaction(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Param('id') transactionId: string,
    @Body() data: {
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
    return this.transactionsService.updateTransaction(userId, transactionId, data);
  }

  @Delete(':id')
  async deleteTransaction(
    @User('id') userId: string,
    @Param('householdId') householdId: string,
    @Param('id') transactionId: string
  ) {
    return this.transactionsService.deleteTransaction(userId, transactionId);
  }
} 