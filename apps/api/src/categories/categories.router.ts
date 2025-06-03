import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { CategoriesService } from './categories.service';
import { z } from 'zod';

@Injectable()
export class CategoriesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly categoriesService: CategoriesService,
  ) {}

  router = this.trpc.router({
    create: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        name: z.string().min(1),
        icon: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { householdId, name, icon, color, isDefault } = input;
        return this.categoriesService.createCategory(ctx.user.id, householdId, { name, icon, color, isDefault });
      }),

    getAll: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
      }))
      .query(async ({ ctx, input }) => {
        return this.categoriesService.getCategories(ctx.user.id, input.householdId);
      }),

    update: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        icon: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { householdId, id, ...data } = input;
        return this.categoriesService.updateCategory(ctx.user.id, id, data);
      }),

    delete: this.trpc.protectedProcedure
      .input(z.object({
        householdId: z.string().uuid(),
        id: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        return this.categoriesService.deleteCategory(ctx.user.id, input.id);
      }),
  });
} 