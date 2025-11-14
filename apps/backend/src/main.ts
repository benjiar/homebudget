import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for file uploads (15MB)
  // Only parse JSON for non-multipart requests
  app.use((req, res, next) => {
    const contentType = req.headers['content-type'];
    console.log(`[${req.method}] ${req.url} - Content-Type: ${contentType || 'none'}`);

    if (contentType && contentType.toLowerCase().startsWith('multipart/form-data')) {
      console.log('  → Skipping JSON parsing (multipart detected)');
      // Skip JSON parsing for multipart requests - let multer handle it
      return next();
    }
    return express.json({ limit: '15mb' })(req, res, next);
  });
  app.use((req, res, next) => {
    const contentType = req.headers['content-type'];
    if (contentType && contentType.toLowerCase().startsWith('multipart/form-data')) {
      // Skip urlencoded parsing for multipart requests - let multer handle it
      return next();
    }
    return express.urlencoded({ limit: '15mb', extended: true })(req, res, next);
  });

  // Enable global validation with transformation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    whitelist: true,
  }));

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-household-ids'],
  });

  // Global error logging
  app.use((err: any, req: any, _res: any, next: any) => {
    console.error('=== GLOBAL ERROR HANDLER ===');
    console.error('Error:', err);
    console.error('Request URL:', req.url);
    console.error('Request Method:', req.method);
    console.error('Stack:', err.stack);
    next(err);
  });

  await app.listen(process.env.BACKEND_PORT || 3001);
  console.log(`Backend application is running on: ${await app.getUrl()}`);
  console.log('Logging enabled for all requests');
}
bootstrap();
