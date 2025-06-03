import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { TransactionsService } from './transactions.service';
import { z } from 'zod';

@Injectable()
export class TransactionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly transactionsService: TransactionsService,
  ) {}

  router = this.trpc.router({
    create: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        type: z.enum(['income', 'expense']),
        amount: z.number().positive(),
        categoryId: z.string().uuid().optional(),
        description: z.string().optional(),
        date: z.string().datetime(),
        receiptUrl: z.string().url().optional(),
        metadata: z.object({
          tags: z.array(z.string()).optional(),
          location: z.string().optional(),
          paymentMethod: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { householdId, type, amount, date, categoryId, description, receiptUrl, metadata } = input;
        return this.transactionsService.createTransaction(ctx.user.id, householdId, {
          type,
          amount,
          date: new Date(date),
          ...(categoryId && { categoryId }),
          ...(description && { description }),
          ...(receiptUrl && { receiptUrl }),
          ...(metadata && { metadata }),
        });
      }),

    getAll: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        type: z.enum(['income', 'expense']).optional(),
        categoryId: z.string().uuid().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { householdId, ...filters } = input;
        return this.transactionsService.getTransactions(ctx.user.id, householdId, {
          ...filters,
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        });
      }),

    getStats: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
      }))
      .query(async ({ ctx, input }) => {
        return this.transactionsService.getTransactionStats(ctx.user.id, input.householdId);
      }),

    get: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        id: z.string().uuid(),
      }))
      .query(async ({ ctx, input }) => {
        return this.transactionsService.getTransaction(ctx.user.id, input.id);
      }),

    update: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        id: z.string().uuid(),
        type: z.enum(['income', 'expense']).optional(),
        amount: z.number().positive().optional(),
        categoryId: z.string().uuid().optional(),
        description: z.string().optional(),
        date: z.string().datetime().optional(),
        receiptUrl: z.string().url().optional(),
        metadata: z.object({
          tags: z.array(z.string()).optional(),
          location: z.string().optional(),
          paymentMethod: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { householdId, id, date, ...rest } = input;
        return this.transactionsService.updateTransaction(ctx.user.id, id, { ...rest, ...(date ? { date: new Date(date) } : {}) });
      }),

    delete: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        id: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        return this.transactionsService.deleteTransaction(ctx.user.id, input.id);
      }),
  });
}

// Export the tRPC router type for frontend use
export type TransactionsAppRouter = typeof TransactionsRouter.prototype.router; 