import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('db.url');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const adapter = new PrismaPg({
      connectionString,
      max: configService.get<number>('db.poolMax') ?? 5,
      connectionTimeoutMillis:
        configService.get<number>('db.connectionTimeoutMs') ?? 10_000,
      idleTimeoutMillis:
        configService.get<number>('db.idleTimeoutMs') ?? 30_000,
      query_timeout: configService.get<number>('db.queryTimeoutMs') ?? 15_000,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
