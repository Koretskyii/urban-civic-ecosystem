import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const tlsEnabled = process.env.TLS_ENABLED === 'true';

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined;
  if (tlsEnabled) {
    const certPath = process.env.TLS_CERT_PATH || './certs/cert.pem';
    const keyPath = process.env.TLS_KEY_PATH || './certs/key.pem';
    httpsOptions = {
      key: fs.readFileSync(path.resolve(keyPath)),
      cert: fs.readFileSync(path.resolve(certPath)),
    };
  }

  const app = await NestFactory.create(AppModule, {
    ...(httpsOptions && { httpsOptions }),
  });

  const swaggerConfig = new DocumentBuilder().setTitle('API documentation').setDescription('API documentation for Urban Civic Ecosystem').setVersion('1.0').addBearerAuth().build();
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const port = configService.get<number>('app.port', 3001);
  const corsOrigin = configService.get<string>('app.corsOrigin', 'https://localhost:3000');

  app.use(cookieParser());
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.enableShutdownHooks();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(port);
  const protocol = tlsEnabled ? 'https' : 'http';
  console.log(`[${nodeEnv}] Server running on ${protocol}://localhost:${port}`);

  if (nodeEnv === 'development' && tlsEnabled) {
    console.log('Using self-signed certificate for local development');
  }
}
bootstrap();
