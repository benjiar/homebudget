import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TransactionsRouter } from '../transactions/transactions.router';
import { CategoriesRouter } from '../categories/categories.router';

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly transactionsRouter: TransactionsRouter,
    private readonly categoriesRouter: CategoriesRouter,
  ) {}

  appRouter = this.trpcService.router({
    transactions: this.transactionsRouter.router,
    categories: this.categoriesRouter.router,
  });
}

// Export the unified tRPC AppRouter type for frontend use
export type AppRouter = TrpcRouter['appRouter']; 