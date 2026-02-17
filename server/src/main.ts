import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const corsOrigin = configService.get<string>('app.corsOrigin', 'http://localhost:3001');

  app.enableCors({ origin: corsOrigin });
  app.enableShutdownHooks();

  await app.listen(port);
}
bootstrap();
