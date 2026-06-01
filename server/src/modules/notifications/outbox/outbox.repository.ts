import { Injectable, Logger } from '@nestjs/common';
import { OutboxStatus } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OutboxRepository {
  private readonly logger = new Logger(OutboxRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async takePending(limit: number) {
    this.logger.log(`takePending limit=${limit}`);
    const rows = await this.prisma.domainEventOutbox.findMany({
      where: { status: OutboxStatus.PENDING, availableAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    if (rows.length > 0) {
      await this.prisma.domainEventOutbox.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: { status: OutboxStatus.PROCESSING },
      });
    }

    this.logger.log(`takePending result=${rows.length}`);

    return rows;
  }

  async getById(id: string) {
    return this.prisma.domainEventOutbox.findUnique({ where: { id } });
  }

  async markProcessed(id: string) {
    this.logger.log(`markProcessed outboxEventId=${id}`);
    return this.prisma.domainEventOutbox.update({
      where: { id },
      data: { status: OutboxStatus.PROCESSED, lastError: null },
    });
  }

  async markFailed(id: string, error: string) {
    this.logger.error(`markFailed outboxEventId=${id} error=${error}`);
    return this.prisma.domainEventOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.FAILED,
        attempts: { increment: 1 },
        lastError: error.slice(0, 2000),
      },
    });
  }

  async requeueFailed(id: string) {
    this.logger.log(`requeueFailed outboxEventId=${id}`);
    return this.prisma.domainEventOutbox.update({
      where: { id },
      data: { status: OutboxStatus.PENDING, availableAt: new Date() },
    });
  }
}
