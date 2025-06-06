import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // TODO: Configure CORS, validation pipes, etc.
  await app.listen(process.env.BACKEND_PORT || 3001);
  console.log(`Backend application is running on: ${await app.getUrl()}`);
}
bootstrap();
