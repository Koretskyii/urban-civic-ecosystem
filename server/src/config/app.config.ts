import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['https://localhost:3000'],
}));
