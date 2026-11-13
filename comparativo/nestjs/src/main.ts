import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurar } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configurar(app);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
