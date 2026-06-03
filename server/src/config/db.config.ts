import { registerAs } from '@nestjs/config';

const positiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const dbConfig = registerAs('db', () => {
  return {
    url: process.env.DATABASE_URL,
    poolMax: positiveInt(process.env.DATABASE_POOL_MAX, 5),
    connectionTimeoutMs: positiveInt(
      process.env.DATABASE_CONNECTION_TIMEOUT_MS,
      10_000,
    ),
    queryTimeoutMs: positiveInt(process.env.DATABASE_QUERY_TIMEOUT_MS, 15_000),
    idleTimeoutMs: positiveInt(process.env.DATABASE_IDLE_TIMEOUT_MS, 30_000),
  };
});
