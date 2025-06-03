import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { HouseholdsService } from './households.service';
import { z } from 'zod';
import { CreateHouseholdInput, UpdateHouseholdInput, InviteMemberInput, RemoveMemberInput } from './types';

@Injectable()
export class HouseholdsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly householdsService: HouseholdsService,
  ) {}

  router = this.trpc.router({
    create: this.trpc.protectedProcedure
      .input(z.object({
        name: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return this.householdsService.createHousehold(ctx.user.id, input as CreateHouseholdInput);
      }),

    getAll: this.trpc.protectedProcedure
      .query(async ({ ctx }) => {
        return this.householdsService.getUserHouseholds(ctx.user.id);
      }),

    get: this.trpc.protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .query(async ({ ctx, input }) => {
        return this.householdsService.getHousehold(ctx.user.id, input.id);
      }),

    update: this.trpc.protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        settings: z.object({
          currency: z.string(),
          defaultCategories: z.array(z.string()),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return this.householdsService.updateHousehold(ctx.user.id, id, data as UpdateHouseholdInput);
      }),

    inviteMember: this.trpc.protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        email: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        return this.householdsService.inviteMember(ctx.user.id, input.id, input.email);
      }),

    removeMember: this.trpc.protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        memberId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        return this.householdsService.removeMember(ctx.user.id, input.id, input.memberId);
      }),

    leave: this.trpc.protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        return this.householdsService.leaveHousehold(ctx.user.id, input.id);
      }),
  });
} 