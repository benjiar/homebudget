import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TrpcService } from './trpc/trpc.service';
import { TrpcRouter } from './trpc/trpc.router';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

async function bootstrap() {

  console.log(JSON.stringify(process.env, null, 2));
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Set up tRPC
  const trpcService = app.get(TrpcService);
  const trpcRouter = app.get(TrpcRouter);

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: trpcRouter.appRouter,
      createContext: trpcService.createContext,
    })
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3001);
}

bootstrap();