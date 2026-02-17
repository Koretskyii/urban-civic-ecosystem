import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(private configService: ConfigService) {
        const adapter = new PrismaPg({
            connectionString: configService.get<string>('db.url'),
        })
        super({
            adapter,
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
}
