import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { SupabaseService } from '../lib/supabase.service';

export type Context = {
  user: {
    id: string;
    email: string;
  } | null;
};

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create();
  procedure = this.trpc.procedure;
  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;

  constructor(private supabaseService: SupabaseService) {}

  createContext = async ({ req }: CreateExpressContextOptions): Promise<Context> => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return { user: null };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return { user: null };
    }

    try {
      const { data: { user }, error } = await this.supabaseService.getClient().auth.getUser(token);
      if (error || !user) {
        return { user: null };
      }

      return {
        user: {
          id: user.id,
          email: user.email!,
        },
      };
    } catch (error) {
      return { user: null };
    }
  };

  isAuthed = this.trpc.middleware(({ next, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });

  protectedProcedure = this.trpc.procedure.use(this.isAuthed);
} 